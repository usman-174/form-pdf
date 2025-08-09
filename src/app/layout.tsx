import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Form Filler",
  description: "Created in next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Development Overlay */}
        <div className="fixed top-0 left-0 right-0 bg-transparent text-center py-2 z-[9999]">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="font-semibold text-sm text-red-500">Project Under Development ~ Usman</span>
            </div>

          </div>
        </div>
        
        {/* Main content with top margin to account for overlay */}
        <div>
          {children}
        </div>
      </body>
    </html>
  );
}
