import { ThemeSwitcher } from "@/components/theme-switcher"
import { NotificationsDropdown } from "@/components/notifications-dropdown"

interface SiteHeaderProps {
  pendingCount?: number;
  pendingDonorsCount?: number;
}

export function SiteHeader({ pendingCount, pendingDonorsCount }: SiteHeaderProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background  p-4 lg:p-6">
      <div className="flex w-full items-center justify-between">
        <div className="text-lg font-semibold">Dashboard</div>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <NotificationsDropdown
            pendingCount={pendingCount}
            pendingDonorsCount={pendingDonorsCount}
          />
        </div>
      </div>
    </header>
  )
}
