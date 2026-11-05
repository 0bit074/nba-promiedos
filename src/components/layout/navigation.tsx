"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { NAV_ITEMS } from "./nav-items";

interface NavLinksProps {
  /** `null` en el HTML estático, cuando la ruta todavía no se conoce. */
  pathname: string | null;
}

function isActivePath(
  pathname: string | null,
  href: string,
  relatedPath?: string,
) {
  if (pathname === null) return false;
  if (href === "/") return pathname === "/";
  return (
    pathname.startsWith(href) ||
    (relatedPath !== undefined && pathname.startsWith(relatedPath))
  );
}

function DesktopNavLinks({ pathname }: NavLinksProps) {
  return (
    <ul className="flex items-center gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon, relatedPath }) => {
        const isActive = isActivePath(pathname, href, relatedPath);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-surface-raised text-foreground"
                  : "text-muted hover:bg-surface hover:text-foreground"
              }`}
            >
              <Icon
                aria-hidden
                className={`size-4 ${isActive ? "text-accent" : ""}`}
              />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function MobileNavLinks({ pathname }: NavLinksProps) {
  return (
    <ul className="grid grid-cols-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon, relatedPath }) => {
        const isActive = isActivePath(pathname, href, relatedPath);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                isActive ? "text-accent" : "text-muted"
              }`}
            >
              <Icon aria-hidden className="size-5" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function CurrentDesktopNavLinks() {
  return <DesktopNavLinks pathname={usePathname()} />;
}

function CurrentMobileNavLinks() {
  return <MobileNavLinks pathname={usePathname()} />;
}

/** Navegación horizontal dentro del header (tablet y PC). */
export function DesktopNav() {
  return (
    <nav aria-label="Principal" className="hidden md:block">
      <Suspense fallback={<DesktopNavLinks pathname={null} />}>
        <CurrentDesktopNavLinks />
      </Suspense>
    </nav>
  );
}

/** Barra de pestañas fija en la parte inferior (celulares). */
export function MobileNav() {
  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <Suspense fallback={<MobileNavLinks pathname={null} />}>
        <CurrentMobileNavLinks />
      </Suspense>
    </nav>
  );
}
