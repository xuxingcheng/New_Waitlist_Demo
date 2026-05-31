import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ClipboardList, Settings, Smartphone, Workflow } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Restaurant Queue Demo",
  description:
    "Restaurant waitlist demo with online confirmations, virtual waiting groups, final check-in, seating, and wait-time learning."
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
          <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link href="/" className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-white">
                <ClipboardList className="h-5 w-5" aria-hidden />
              </span>
              <span className="truncate text-sm font-black text-ink sm:text-base">
                Smart Restaurant Queue Demo
              </span>
            </Link>
            <div className="flex items-center gap-1 rounded-md bg-slate-100 p-1">
              <Link
                href="/customer"
                className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-bold text-slate-700 hover:bg-white sm:px-3"
                title="Customer page"
              >
                <Smartphone className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Customer</span>
              </Link>
              <Link
                href="/admin"
                className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-bold text-slate-700 hover:bg-white sm:px-3"
                title="Admin page"
              >
                <Settings className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Admin</span>
              </Link>
              <Link
                href="/demo"
                className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-sm font-bold text-slate-700 hover:bg-white sm:px-3"
                title="Demo simulation page"
              >
                <Workflow className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Demo</span>
              </Link>
            </div>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
