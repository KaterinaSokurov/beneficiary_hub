"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { UserRole } from "@/types/database.types";

interface DashboardLayoutProps {
  role: UserRole;
  userName: string;
  userEmail?: string;
  children: React.ReactNode;
  pendingCount?: number;
  pendingDonorsCount?: number;
}

export function DashboardLayout({
  role,
  userName,
  userEmail,
  children,
  pendingCount,
  pendingDonorsCount
}: DashboardLayoutProps) {
  return (
    <div className="h-screen w-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={15} minSize={15} maxSize={30}>
          <AppSidebar
            role={role}
            pendingCount={pendingCount}
            pendingDonorsCount={pendingDonorsCount}
            userName={userName}
            userEmail={userEmail || ""}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={85}>
          <div className="flex h-full flex-col">
            <SiteHeader
              pendingCount={pendingCount}
              pendingDonorsCount={pendingDonorsCount}
            />
            <main className="flex-1 overflow-auto">
              <div className="@container/main h-full">
                <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-6">
                  {children}
                </div>
              </div>
            </main>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
