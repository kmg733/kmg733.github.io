"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export default function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`nav-link-animated text-amber-700 hover:text-amber-900 dark:text-zinc-400 dark:hover:text-zinc-100 ${isActive ? "active" : ""}`}
    >
      {children}
    </Link>
  );
}
