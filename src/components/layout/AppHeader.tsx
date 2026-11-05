import Link from "next/link";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { PushNotifications } from "@/components/pwa/PushNotifications";
import { APP_NAME } from "@/lib/site";
import { DesktopNav } from "./navigation";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background pt-[env(safe-area-inset-top)]">
      <div className="relative mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          <span
            aria-hidden
            className="size-3 rounded-full bg-accent ring-4 ring-accent/20"
          />
          {APP_NAME}
        </Link>
        <div className="flex items-center gap-2">
          <DesktopNav />
          <PushNotifications />
        </div>
      </div>
      <OfflineBanner />
    </header>
  );
}
