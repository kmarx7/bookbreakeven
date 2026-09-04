import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "출판 저자 손익분기(BEP) 계산기",
  description:
    "독립출판 저자를 위한 손익분기 계산기. 인쇄부수·판매가·판매채널별 수수료를 조정하며 권당 실수령액과 손익분기 판매부수를 실시간으로 비교합니다.",
};

export const viewport: Viewport = {
  themeColor: "#0b2545",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
