import type { Metadata } from "next";
import { Gowun_Batang, Noto_Sans_KR } from "next/font/google";
import Link from "next/link";
import UserMenu from "./UserMenu";
import { JourneyProvider } from "./JourneyProvider";
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
  title: "QuestLearn — 다아라 왕국과 기억의 성배",
  description:
    "학습자료를 게임 퀘스트로. 다섯 지역을 탐험하며 배우는 교육용 퀴즈 모험.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${sans.variable} ${display.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 antialiased">
        <JourneyProvider>
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
                  href="/map"
                  className="rounded-lg px-3 py-1.5 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                >
                  🗺️ 지도
                </Link>
                <UserMenu />
              </nav>
            </div>
          </header>
          <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
            QuestLearn · 다아라 왕국과 기억의 성배 · Powered by Claude
          </footer>
        </JourneyProvider>
      </body>
    </html>
  );
}
