import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Event Lead Manager",
  description: "A full-stack, AI-native SaaS dashboard to capture, organize, summarize, and draft follow-ups for event leads with Gemini AI and PostgreSQL.",
  openGraph: {
    title: "AI Event Lead Manager",
    description: "A full-stack, AI-native SaaS dashboard to capture, organize, summarize, and draft follow-ups for event leads with Gemini AI and PostgreSQL.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
