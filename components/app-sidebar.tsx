"use client";

import * as React from "react";
import Link from "next/link";
import { UserRole } from "@/types/database.types";
import {
  LayoutDashboard,
  School,
  Heart,
  Users,
  CheckCircle,
  FileText,
  Settings,
  BarChart3,
  HelpCircle,
  Package,
} from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";

interface AppSidebarProps {
  role: UserRole;
  pendingCount?: number;
  pendingDonorsCount?: number;
  userName: string;
  userEmail: string;
}

export function AppSidebar({
  role,
  pendingCount,
  pendingDonorsCount,
  userName,
  userEmail,
}: AppSidebarProps) {
  const navMainItems = React.useMemo(() => {
    const items = {
      admin: [
        { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
        {
          title: "School Approvals",
          url: "/admin/schools",
          icon: School,
          ...(pendingCount && pendingCount > 0 ? { badge: pendingCount } : {}),
        },
        {
          title: "Donor Approvals",
          url: "/admin/donors",
          icon: Heart,
          ...(pendingDonorsCount && pendingDonorsCount > 0 ? { badge: pendingDonorsCount } : {}),
        },
        { title: "Donations", url: "/admin/donations", icon: Package },
        { title: "User Management", url: "/admin/users", icon: Users },
        { title: "Reports", url: "/admin/reports", icon: BarChart3 },
      ],
      approver: [
        { title: "Dashboard", url: "/approver", icon: LayoutDashboard },
        {
          title: "Resource Approvals",
          url: "/approver/resources",
          icon: CheckCircle,
        },
        { title: "Applications", url: "/approver/applications", icon: FileText },
      ],
      donor: [
        { title: "Dashboard", url: "/donor", icon: LayoutDashboard },
        { title: "Donations", url: "/donor/donations", icon: Package },
      ],
      school: [
        { title: "Dashboard", url: "/school", icon: LayoutDashboard },
        { title: "Applications", url: "/school/applications", icon: FileText },
        { title: "Settings", url: "/school/settings", icon: Settings },
      ],
    };
    return items[role] || [];
  }, [role, pendingCount, pendingDonorsCount]);

  const navSecondaryItems = React.useMemo(
    () => [
      // { title: "Settings", url: `/${role}/settings`, icon: Settings },
      // { title: "Help & Support", url: `/${role}/help`, icon: HelpCircle },
    ],
    [role]
  );

  const getRoleDisplay = (role: UserRole) => {
    return {
      admin: "Administrator",
      approver: "Approver",
      donor: "Donor",
      school: "School",
    }[role];
  };

  return (
    <div className="flex h-full flex-col border-r bg-sidebar">
      {/* Header */}
      <div className="border-b p-4">
        <Link href={`/${role}`} className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg font-bold">BH</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Beneficiary Hub</span>
            <span className="text-xs text-muted-foreground">{getRoleDisplay(role)}</span>
          </div>
        </Link>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-auto p-4">
        <NavMain items={navMainItems} />
        <div className="mt-4">
          <NavSecondary items={navSecondaryItems} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <NavUser user={{ name: userName, email: userEmail, avatar: "" }} />
      </div>
    </div>
  );
}
