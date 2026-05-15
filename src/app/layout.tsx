import type { Metadata } from "next";
import { ThemeBootstrap } from "@/components/ThemeBootstrap";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Mahjong Focus",
  description:
    "A modern Mahjong Solitaire platform for short, calm focus sessions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeBootstrap />
        {children}
      </body>
    </html>
  );
}
