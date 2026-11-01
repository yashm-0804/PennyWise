import type { Metadata, Viewport } from "next";
import { Mona_Sans, Mukta } from "next/font/google";
import "./globals.css";

// Mona Sans is the design system's face. Mukta carries Devanagari, which Mona Sans lacks, so Hinglish in either script stays readable.
const mona = Mona_Sans({ subsets: ["latin", "latin-ext"], axes: ["wdth"], variable: "--font-mona" });
const devanagari = Mukta({ weight: ["400", "500", "700"], subsets: ["devanagari"], variable: "--font-deva" });

export const metadata: Metadata = {
  title: "PennyWise",
  description: "Talk through your money. Your goals argue, you make the call.",
};

export const viewport: Viewport = { themeColor: "#FFFFFF", colorScheme: "light", viewportFit: "cover" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${mona.variable} ${devanagari.variable}`}>
      <body>{children}</body>
    </html>
  );
}
