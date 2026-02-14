import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mini Task Tracker",
  description: "A modern task tracker to stay organized and productive",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
