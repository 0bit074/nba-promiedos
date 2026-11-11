import Link from "next/link";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { PushNotifications } from "@/components/pwa/PushNotifications";
import { APP_NAME } from "@/lib/site";
import { BrandLogo } from "./BrandLogo";
import { DesktopNav } from "./navigation";
import { ThemeToggle } from "./ThemeToggle";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background pt-[env(safe-area-inset-top)]">
      <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Link href="/" aria-label={`${APP_NAME}, inicio`} className="shrink-0">
          <BrandLogo />
        </Link>
        <div className="flex items-center gap-2">
          <DesktopNav />
          <PushNotifications />
          <ThemeToggle />
        </div>
      </div>
      <OfflineBanner />
    </header>
  );
}
