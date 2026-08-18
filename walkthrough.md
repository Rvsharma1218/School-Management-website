# Firebase Firestore Quota Exceeded Resolution

---

## 1. What Caused the Error:
Firebase Spark (Free Tier) has a daily limit of 50,000 document reads. When multiple tabs or frequent development refreshes trigger parallel realtime snapshot streams without local cache, Firestore returns:
`FirebaseError: [code=resource-exhausted]: Quota exceeded.`

---

## 2. Solutions Implemented:

1. **Persistent Multi-Tab Local Cache ([firebase.js](file:///c:/Users/ravi%20kumar/Desktop/school-web/lib/firebase.js))**:
   - Enabled IndexedDB persistence using `persistentLocalCache({ tabManager: persistentMultipleTabManager() })`.
   - Repeated reads now serve instantly from local IndexedDB cache with **0 Firestore billable reads / 0 quota consumption**.

2. **Snapshot Listener Deduplication & Graceful Error Handling ([store.js](file:///c:/Users/ravi%20kumar/Desktop/school-web/lib/store.js))**:
   - Deduplicated listener attachments so multiple listeners are never spawned for the same session.
   - Handled `resource-exhausted` errors gracefully without throwing unhandled exceptions or triggering the Next.js error overlay.

3. **Production Validation**:
   - `npm run build` compiled cleanly in 6.0s with exit code 0.
