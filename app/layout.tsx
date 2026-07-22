import type { Metadata } from "next";
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import UserMenu from "./UserMenu";
import "./globals.css";

const sans = Noto_Sans_KR({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const display = Gowun_Batang({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "QuestLearn — 학습자료를 게임 퀘스트로",
  description:
    "학습자료를 붙여넣으면 AI가 5단계 게임 퀘스트 퀴즈로 변환해주는 교사용 도구",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
            <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="text-amber-400">⚔️</span>
              <span>
                Quest<span className="text-amber-400">Learn</span>
              </span>
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-lg px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                퀘스트 만들기
              </Link>
              <Link
                href="/quests"
                className="rounded-lg px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                내 퀘스트
              </Link>
              <UserMenu />
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8">{children}</main>
        <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
          QuestLearn · 학습자료를 게임 퀘스트로 · Powered by Claude
        </footer>
      </body>
    </html>
  );
}
