import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "工程管理アプリ｜町工場デモ",
  description:
    "町工場のホワイトボード・Excel工程表を置き換える、シンプルな工程管理アプリのデモ。誰がどの機械で今何をやってるか・遅延はどこか・明日の予定・を1画面で。",
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
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>© Hiro / 工程管理アプリ デモ（架空データ・サンプル製作所）</p>
            <p>
              旗艦出品「Excel・スプレッドシートの集計やコピペをAIで自動化」の業務ツールサンプル
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
