import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SafePlay - Watch YouTube Without the Profanity",
  description:
    "SafePlay automatically mutes or bleeps profanity in YouTube videos using AI-powered transcription. Perfect for families, educators, and workplaces.",
  keywords: [
    "YouTube filter",
    "profanity filter",
    "family-friendly YouTube",
    "clean YouTube",
    "content filter",
    "parental controls",
    "YouTube for kids",
  ],
  authors: [{ name: "SafePlay" }],
  creator: "SafePlay",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://safeplay.app",
    siteName: "SafePlay",
    title: "SafePlay - Watch YouTube Without the Profanity",
    description:
      "AI-powered profanity filtering for YouTube. Mute or bleep inappropriate language automatically.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SafePlay - Clean YouTube Viewing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SafePlay - Watch YouTube Without the Profanity",
    description:
      "AI-powered profanity filtering for YouTube. Mute or bleep inappropriate language automatically.",
    images: ["/og-image.png"],
    creator: "@safeplayapp",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
