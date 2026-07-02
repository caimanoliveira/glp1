"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Hoje", icon: "☀️" },
  { href: "/dose", label: "Dose", icon: "💉" },
  { href: "/sintomas", label: "Sintomas", icon: "🩺" },
  { href: "/corpo", label: "Corpo", icon: "⚖️" },
  { href: "/treino", label: "Treino", icon: "🏋️" },
  { href: "/config", label: "Config", icon: "⚙️" },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-stretch justify-between px-1">
        {TABS.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                active ? "text-brand" : "text-slate-400"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
