import Link from "next/link";
import { Factory, LayoutDashboard, ListChecks } from "lucide-react";

export default function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-slate-700 transition-colors">
          <Factory className="w-6 h-6 text-blue-600" />
          <div>
            <p className="text-base font-semibold leading-tight">工程管理</p>
            <p className="text-xs text-slate-500 leading-tight">サンプル製作所</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            href="/"
            className="px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-1.5 text-slate-700"
          >
            <ListChecks className="w-4 h-4" />
            <span>工程一覧</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-3 py-2 rounded-md hover:bg-slate-100 flex items-center gap-1.5 text-slate-700"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ダッシュボード</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
