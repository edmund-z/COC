import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Create or Consume",
  description: "Daily accountability tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black min-h-screen">{children}</body>
    </html>
  );
}
