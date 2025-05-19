import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CrossmintAuthProvider } from "@/components/CrossmintProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Crossmint Auth Demo",
  description: "Next.js app with Crossmint authentication and Supabase",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <CrossmintAuthProvider>
          {children}
        </CrossmintAuthProvider>
      </body>
    </html>
  );
}
