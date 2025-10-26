"use client";

import { useRouter } from "next/navigation";
import { Bell, School, Heart, CheckCircle, ArrowRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface NotificationsDropdownProps {
  pendingCount?: number;
  pendingDonorsCount?: number;
}

export function NotificationsDropdown({ pendingCount, pendingDonorsCount }: NotificationsDropdownProps) {
  const router = useRouter();

  const totalNotifications = (pendingCount || 0) + (pendingDonorsCount || 0);

  const handleSchoolApprovalsClick = () => {
    router.push("/admin/schools");
  };

  const handleDonorApprovalsClick = () => {
    router.push("/admin/donors");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {totalNotifications > 9 ? "9+" : totalNotifications}
            </span>
          )}
          <span className="sr-only">View notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {totalNotifications > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {totalNotifications} new
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {pendingCount && pendingCount > 0 && (
          <>
            <DropdownMenuItem
              className="flex items-start gap-3 py-3 cursor-pointer"
              onClick={handleSchoolApprovalsClick}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-500">
                <School className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">School registrations</p>
                <p className="text-xs text-muted-foreground">
                  {pendingCount} {pendingCount === 1 ? 'school' : 'schools'} awaiting approval
                </p>
              </div>
              <ArrowRight className="h-4 w-4 opacity-50" />
            </DropdownMenuItem>
          </>
        )}

        {pendingDonorsCount && pendingDonorsCount > 0 && (
          <>
            <DropdownMenuItem
              className="flex items-start gap-3 py-3 cursor-pointer"
              onClick={handleDonorApprovalsClick}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-500">
                <Users className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Donor verifications</p>
                <p className="text-xs text-muted-foreground">
                  {pendingDonorsCount} {pendingDonorsCount === 1 ? 'donor' : 'donors'} awaiting verification
                </p>
              </div>
              <ArrowRight className="h-4 w-4 opacity-50" />
            </DropdownMenuItem>
          </>
        )}

        {totalNotifications > 0 && <DropdownMenuSeparator />}

        <DropdownMenuItem
          className="flex items-start gap-3 py-3 opacity-60 cursor-not-allowed"
          disabled
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-500">
            <Heart className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">New donations</p>
            <p className="text-xs text-muted-foreground">
              No new donations
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="flex items-start gap-3 py-3 opacity-60 cursor-not-allowed"
          disabled
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-500">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Resource approvals</p>
            <p className="text-xs text-muted-foreground">
              No pending approvals
            </p>
          </div>
        </DropdownMenuItem>

        {totalNotifications === 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-4 text-center text-sm text-muted-foreground">
              No new notifications
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
