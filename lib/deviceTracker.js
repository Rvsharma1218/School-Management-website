'use client';

import { db } from './firebase';
import { doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Detect Detailed Device Information
 */
export function getClientDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'unknown',
      os: 'unknown',
      browser: 'unknown',
      screenResolution: 'N/A',
      windowSize: 'N/A',
      language: 'en',
      timezone: 'UTC',
      userAgent: '',
    };
  }

  const ua = navigator.userAgent || '';
  let os = 'Unknown OS';
  if (/windows phone/i.test(ua)) os = 'Windows Phone';
  else if (/win(dows )?nt 10\.0/i.test(ua)) os = 'Windows 10/11';
  else if (/win(dows )?nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/win(dows )?nt 6\.2/i.test(ua)) os = 'Windows 8';
  else if (/win(dows )?nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) {
    const match = ua.match(/android\s([0-9\.]*)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/iphone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/ipad/i.test(ua)) os = 'iOS (iPad)';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/cros/i.test(ua)) os = 'Chrome OS';

  let browser = 'Unknown Browser';
  if (/edg([ea]|ios)?\/([0-9\.]+)/i.test(ua)) {
    const m = ua.match(/edg([ea]|ios)?\/([0-9\.]+)/i);
    browser = `Edge ${m ? m[2].split('.')[0] : ''}`;
  } else if (/opr\/|opera\//i.test(ua)) {
    const m = ua.match(/(?:opr|opera)\/([0-9\.]+)/i);
    browser = `Opera ${m ? m[1].split('.')[0] : ''}`;
  } else if (/chrome|crios/i.test(ua) && !/edg|opr/i.test(ua)) {
    const m = ua.match(/(?:chrome|crios)\/([0-9\.]+)/i);
    browser = `Chrome ${m ? m[1].split('.')[0] : ''}`;
  } else if (/firefox|fxios/i.test(ua)) {
    const m = ua.match(/(?:firefox|fxios)\/([0-9\.]+)/i);
    browser = `Firefox ${m ? m[1].split('.')[0] : ''}`;
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    const m = ua.match(/version\/([0-9\.]+)/i);
    browser = `Safari ${m ? m[1].split('.')[0] : ''}`;
  }

  // Device Type Detection
  let deviceType = 'Desktop';
  const touchPoints = navigator.maxTouchPoints || 0;
  const isMobileUa = /mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua);
  const isTabletUa = /ipad|tablet|(android(?!.*mobile))/i.test(ua);

  if (isTabletUa || (touchPoints > 1 && window.innerWidth >= 600 && window.innerWidth <= 1024)) {
    deviceType = 'Tablet';
  } else if (isMobileUa || (touchPoints > 0 && window.innerWidth < 600)) {
    deviceType = 'Mobile';
  }

  const screenRes = `${window.screen?.width || 0}x${window.screen?.height || 0} (${window.devicePixelRatio || 1}x)`;
  const winSize = `${window.innerWidth || 0}x${window.innerHeight || 0}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const lang = navigator.language || 'en';
  const cores = navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Cores` : 'N/A';

  return {
    deviceType,
    os,
    browser: browser.trim(),
    screenResolution: screenRes,
    windowSize: winSize,
    language: lang,
    timezone: tz,
    cpuCores: cores,
    userAgent: ua,
    platform: navigator.platform || 'Web',
    onlineStatus: navigator.onLine ? 'online' : 'offline',
  };
}

/**
 * Fetch Approximate IP Address & City with safe fallbacks and session caching
 */
export async function getClientIpAndLocation() {
  if (typeof window === 'undefined') return { ip: 'N/A', city: 'N/A', region: 'N/A', country: 'N/A' };

  try {
    const cached = sessionStorage.getItem('sch_device_ip_geo');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (_) {}

  // 1. Try ipapi.co
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const info = {
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country_name || 'India',
        postal: data.postal || '',
        org: data.org || data.asn || '',
      };
      try { sessionStorage.setItem('sch_device_ip_geo', JSON.stringify(info)); } catch (_) {}
      return info;
    }
  } catch (_) {}

  // 2. Fallback to freeipapi.com
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const info = {
        ip: data.ipAddress || 'Unknown',
        city: data.cityName || 'Unknown',
        region: data.regionName || 'Unknown',
        country: data.countryName || 'India',
        postal: data.zipCode || '',
        org: '',
      };
      try { sessionStorage.setItem('sch_device_ip_geo', JSON.stringify(info)); } catch (_) {}
      return info;
    }
  } catch (_) {}

  // 3. Fallback to basic ipify
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const info = { ip: data.ip || 'Unknown', city: 'Unknown', region: 'Unknown', country: 'India' };
      try { sessionStorage.setItem('sch_device_ip_geo', JSON.stringify(info)); } catch (_) {}
      return info;
    }
  } catch (_) {}

  return { ip: 'N/A', city: 'Unknown', region: 'Unknown', country: 'India' };
}

/**
 * Request GPS / Browser Geolocation
 */
export function requestBrowserLocation() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({ status: 'unsupported' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const acc = Math.round(pos.coords.accuracy || 0);
        resolve({
          status: 'granted',
          latitude: lat,
          longitude: lng,
          accuracyMeters: acc,
          mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`,
        });
      },
      (err) => {
        let st = 'denied';
        if (err.code === 2) st = 'unavailable';
        if (err.code === 3) st = 'timeout';
        resolve({
          status: st,
          errorCode: err.code,
          errorMessage: err.message,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 9000,
        maximumAge: 60000,
      }
    );
  });
}

/**
 * Request Camera Permission & Capture Low-Res Security Snapshot
 */
export async function requestCameraPermissionAndSnapshot() {
  if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { status: 'unsupported' };
  }

  let stream = null;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 320 },
        height: { ideal: 240 },
        facingMode: 'user',
      },
      audio: false,
    });

    // Create a temporary off-screen video element to capture 1 frame
    const video = document.createElement('video');
    video.playsInline = true;
    video.muted = true;
    video.srcObject = stream;

    await new Promise((res, rej) => {
      const timeout = setTimeout(() => res(), 2000);
      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        video.play().then(res).catch(res);
      };
      video.onerror = rej;
    });

    // Capture small snapshot thumbnail
    let snapshotBase64 = null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 160, 120);
        snapshotBase64 = canvas.toDataURL('image/jpeg', 0.45);
      }
    } catch (_) {}

    // IMPORTANT: Turn off camera stream immediately to turn off webcam light!
    stream.getTracks().forEach((track) => {
      try { track.stop(); } catch (_) {}
    });

    return {
      status: 'granted',
      snapshot: snapshotBase64,
    };
  } catch (err) {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try { track.stop(); } catch (_) {}
      });
    }
    const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
    return {
      status: isDenied ? 'denied' : 'error',
      errorName: err.name,
      errorMessage: err.message,
    };
  }
}

/**
 * Session ID manager
 */
export function getOrCreateSessionId() {
  if (typeof window === 'undefined') return 'server_session';
  let sId = sessionStorage.getItem('sch_device_session_id');
  if (!sId) {
    const rnd = Math.random().toString(36).substring(2, 9);
    sId = `SES_${Date.now()}_${rnd}`;
    sessionStorage.setItem('sch_device_session_id', sId);
  }
  return sId;
}

let heartbeatTimer = null;

/**
 * Record or Update Session in Firestore with full Telemetry
 */
export async function syncDeviceSession({
  schoolId = 'SCHOOL_001',
  schoolName = 'School Management',
  currentUser = null,
  locationData = null,
  cameraData = null,
  securityConfig = {},
}) {
  if (typeof window === 'undefined' || !db) return null;

  const sessionId = getOrCreateSessionId();
  const deviceInfo = getClientDeviceInfo();
  const ipInfo = await getClientIpAndLocation();

  const payload = {
    sessionId,
    schoolId: schoolId || 'SCHOOL_001',
    schoolName: schoolName || 'School Management',
    userId: currentUser?.uid || currentUser?.id || 'anonymous',
    userName: currentUser?.name || currentUser?.displayName || 'Website Guest',
    userEmail: currentUser?.email || 'N/A',
    userRole: currentUser?.role || 'Guest',

    // Device telemetry
    deviceType: deviceInfo.deviceType,
    os: deviceInfo.os,
    browser: deviceInfo.browser,
    screenResolution: deviceInfo.screenResolution,
    windowSize: deviceInfo.windowSize,
    language: deviceInfo.language,
    timezone: deviceInfo.timezone,
    cpuCores: deviceInfo.cpuCores,
    userAgent: deviceInfo.userAgent,
    platform: deviceInfo.platform,

    // Network & IP Location
    ipAddress: ipInfo.ip,
    city: ipInfo.city,
    region: ipInfo.region,
    country: ipInfo.country,
    isp: ipInfo.org || '',

    // Geolocation details
    locationStatus: locationData?.status || 'not_requested',
    latitude: locationData?.latitude || null,
    longitude: locationData?.longitude || null,
    accuracyMeters: locationData?.accuracyMeters || null,
    mapsUrl: locationData?.mapsUrl || (locationData?.latitude ? `https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}` : null),

    // Camera details
    cameraStatus: cameraData?.status || 'not_requested',
    cameraSnapshot: cameraData?.snapshot || null,

    status: 'online',
    lastActive: serverTimestamp(),
  };

  // Safe Multi-Path Sync
  const syncTargets = [
    // 1. Direct school directory security session (open permissions)
    doc(db, 'schoolDirectory', 'system_security_sessions', 'sessions', sessionId),
    // 2. system_config device session
    doc(db, 'system_config', 'device_sessions', 'logs', sessionId),
  ];

  if (schoolId && schoolId !== 'all') {
    syncTargets.push(doc(db, 'schools', schoolId, 'device_sessions', sessionId));
  }

  for (const targetRef of syncTargets) {
    try {
      await setDoc(targetRef, { ...payload, createdAt: serverTimestamp() }, { merge: true });
    } catch (e) {
      // Non-fatal if specific collection has restrictive rules
    }
  }

  // Heartbeat every 60s
  if (!heartbeatTimer && typeof window !== 'undefined') {
    heartbeatTimer = setInterval(async () => {
      try {
        const updatePayload = {
          lastActive: serverTimestamp(),
          status: document.visibilityState === 'hidden' ? 'idle' : 'online',
        };
        for (const targetRef of syncTargets) {
          try {
            await updateDoc(targetRef, updatePayload);
          } catch (_) {}
        }
      } catch (_) {}
    }, 60000);

    // Set offline on tab close
    window.addEventListener('beforeunload', () => {
      try {
        for (const targetRef of syncTargets) {
          updateDoc(targetRef, { status: 'offline', lastActive: serverTimestamp() }).catch(() => {});
        }
      } catch (_) {}
    });
  }

  return payload;
}
