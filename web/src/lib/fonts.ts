import { IBM_Plex_Sans, Syne } from "next/font/google";

export const rsDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-rs-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const rsBody = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-rs-body",
  weight: ["400", "500", "600"],
  display: "swap",
});
