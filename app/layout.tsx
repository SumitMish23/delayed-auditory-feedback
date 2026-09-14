import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Echo Delay Lab",
  description: "A focused delayed auditory feedback practice tool."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
