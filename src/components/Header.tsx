'use client';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Factory, LayoutDashboard, ListChecks } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const isList = pathname === "/" || pathname.startsWith("/process");
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-slate-900 hover:text-slate-700 transition-colors">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-base font-semibold leading-tight">工程管理</p>
            <p className="text-xs text-slate-500 leading-tight">サンプル製作所</p>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavItem href="/" active={isList} icon={<ListChecks className="w-4 h-4" />} label="工程一覧" />
          <NavItem href="/dashboard" active={isDashboard} icon={<LayoutDashboard className="w-4 h-4" />} label="ダッシュボード" />
        </nav>
      </div>
    </header>
  );
}

function NavItem({ href, active, icon, label }: { href: string; active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md flex items-center gap-1.5 transition-colors ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
