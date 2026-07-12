import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeReview AI — AI-Powered Code Review Assistant",
  description:
    "Catch security vulnerabilities, logic errors, and performance issues before they reach production with AI-driven code analysis.",
  keywords: [
    "Code Review",
    "AI",
    "Security",
    "Code Quality",
    "Pull Request",
    "GitHub",
  ],
  authors: [{ name: "CodeReview AI Team" }],
  icons: {
    icon: "/codereview-logo.png",
    shortcut: "/codereview-logo.png",
    apple: "/codereview-logo.png",
  },
  openGraph: {
    title: "CodeReview AI — AI-Powered Code Review Assistant",
    description:
      "Catch security vulnerabilities, logic errors, and performance issues before they reach production with AI-driven code analysis.",
    images: ["/codereview-logo.png"],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CodeReview AI",
    description: "AI-powered code review on your real pull requests.",
    images: ["/codereview-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
