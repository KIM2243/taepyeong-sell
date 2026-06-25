import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "태평프레시 임직원 특가몰",
  description: "태평프레시 기업 임직원 전용 특가 쇼핑몰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
