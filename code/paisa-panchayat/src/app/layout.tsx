import type { Metadata, Viewport } from "next";
import { Baloo_2, Mukta } from "next/font/google";
import "./globals.css";

// Both faces cover Latin and Devanagari, so Hinglish in either script stays in one voice.
const display = Baloo_2({ weight: ["600", "700", "800"], subsets: ["latin", "devanagari"], variable: "--font-display" });
const body = Mukta({ weight: ["400", "500", "700", "800"], subsets: ["latin", "devanagari"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Paisa Panchayat",
  description: "Talk through your money. Your goals argue, you make the call.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = { themeColor: "#FFF8EE", colorScheme: "light" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
