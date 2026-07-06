import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "工程管理アプリ｜町工場デモ",
  description:
    "町工場のホワイトボード・Excel工程表を置き換える、シンプルな工程管理アプリのデモ。誰がどの機械で今何をやってるか・遅延はどこか・明日の予定・を1画面で。",
  openGraph: {
    title: "工程管理アプリ｜町工場デモ",
    description:
      "町工場のホワイトボード・Excel工程表を置き換える工程管理アプリのデモ。案件別進捗・機械稼働率・作業者負荷を1画面で可視化。",
    url: "https://process-manager-demo.vercel.app",
    siteName: "工程管理アプリ デモ",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "工程管理アプリ｜町工場デモ",
    description:
      "町工場のホワイトボード・Excel工程表を置き換える工程管理アプリのデモ。案件別進捗・機械稼働率・作業者負荷を1画面で可視化。",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-slate-200 bg-white mt-8">
          <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="space-y-1">
              <p className="text-slate-700 font-medium">工程管理アプリ デモ</p>
              <p>© Hiro（HiroBuilds）｜ 架空データ・サンプル製作所・全部フィクション</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-slate-600">
              <a
                href="https://github.com/hirobuilds7/process-manager-demo"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-700 transition-colors underline decoration-slate-300 hover:decoration-blue-400 underline-offset-2"
              >
                GitHub
              </a>
              <span className="text-slate-300">·</span>
              <a
                href="https://sales-report-app.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-700 transition-colors underline decoration-slate-300 hover:decoration-blue-400 underline-offset-2"
              >
                デモ第1弾（売上集計）
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
