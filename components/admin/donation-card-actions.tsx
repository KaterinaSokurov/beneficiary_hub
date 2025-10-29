"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";
import { DonationMatchingDialog } from "./donation-matching-dialog";

interface DonationCardActionsProps {
  donationId: string;
  donationTitle: string;
  approvalStatus: string;
  status: string;
  onMatchAllocated?: () => void;
}

export function DonationCardActions({
  donationId,
  donationTitle,
  approvalStatus,
  status,
  onMatchAllocated,
}: DonationCardActionsProps) {
  const [matchingDialogOpen, setMatchingDialogOpen] = useState(false);

  // Only show matching for approved donations that aren't allocated yet
  const showMatching = approvalStatus === "approved" && status === "approved";

  if (!showMatching) {
    return null;
  }

  return (
    <>
      <div className="mt-4 pt-4 border-t">
        <Button
          onClick={() => setMatchingDialogOpen(true)}
          className="w-full gap-2"
          variant="default"
        >
          <Brain className="h-4 w-4" />
          Find Best School Match
        </Button>
      </div>

      <DonationMatchingDialog
        open={matchingDialogOpen}
        onOpenChange={setMatchingDialogOpen}
        donationId={donationId}
        donationTitle={donationTitle}
        onMatchAllocated={onMatchAllocated}
      />
    </>
  );
}
