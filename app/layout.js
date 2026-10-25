import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#102747',
};

export const metadata = {
  title: "Smart School ERP | Next-Gen Cloud School Management Software & SaaS Platform",
  description: "Complete all-in-one School Management Software & ERP for schools, academies, and coaching institutes. Manage student admissions, fee desk with WhatsApp alerts, attendance, timetable, results, ID & admit cards, and subscription plans.",
  openGraph: {
    title: "Smart School ERP | Cloud School Management Software & SaaS Platform",
    description: "Complete all-in-one School Management Software & ERP for schools, academies, and coaching institutes. Manage student admissions, fee desk with WhatsApp alerts, attendance, timetable, results, ID & admit cards, and subscription plans.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart School ERP | Cloud School Management Software & SaaS Platform",
    description: "Complete all-in-one School Management Software & ERP for schools, academies, and coaching institutes. Manage student admissions, fee desk with WhatsApp alerts, attendance, timetable, results, ID & admit cards, and subscription plans.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
