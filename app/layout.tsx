import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "Echo Delay Lab | Delayed Auditory Feedback Tool",

  description:
    "Practice speaking with delayed auditory feedback (DAF). Adjust the audio delay and use real-time feedback for speech practice and fluency training.",

  verification: {
    google: "VeMqB8O6rio0xiXfhoBoWMdZ7NYMKsL-mijHEWWXh9M",
  },

  keywords: [
    "Delayed Auditory Feedback",
    "DAF",
    "DAF tool",
    "speech practice",
    "fluency practice",
    "speech therapy tool",
  ],

  openGraph: {
    title: "Echo Delay Lab | Delayed Auditory Feedback Tool",
    description:
      "Practice speaking with adjustable delayed auditory feedback and real-time audio feedback.",
    type: "website",
    siteName: "Echo Delay Lab",
  },
};


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
