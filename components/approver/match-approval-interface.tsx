"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Brain, Package, School, MapPin, Users, Loader2, AlertCircle } from "lucide-react";
import { getPendingMatches, approveMatch, rejectMatch, getMatchHistory } from "@/app/actions/approve-matches";
import { toast } from "sonner";

export function MatchApprovalInterface() {
  const [pendingMatches, setPendingMatches] = useState<any[]>([]);
  const [matchHistory, setMatchHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approverNotes, setApproverNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pendingResult, historyResult] = await Promise.all([
        getPendingMatches(),
        getMatchHistory(),
      ]);

      if (pendingResult.success) {
        setPendingMatches(pendingResult.matches || []);
      }

      if (historyResult.success) {
        setMatchHistory(historyResult.matches || []);
      }
    } catch (error) {
      toast.error("Error loading matches");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (matchId: string) => {
    setProcessing(true);
    try {
      const result = await approveMatch(matchId, approverNotes);
      if (result.success) {
        toast.success("Match approved successfully!");
        await loadData();
        setSelectedMatch(null);
        setApproverNotes("");
      } else {
        toast.error(result.error || "Failed to approve match");
      }
    } catch (error) {
      toast.error("Error approving match");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const result = await rejectMatch(selectedMatch.id, rejectionReason, approverNotes);
      if (result.success) {
        toast.success("Match rejected. Admin can try allocating to a different school.");
        await loadData();
        setShowRejectDialog(false);
        setSelectedMatch(null);
        setRejectionReason("");
        setApproverNotes("");
      } else {
        toast.error(result.error || "Failed to reject match");
      }
    } catch (error) {
      toast.error("Error rejecting match");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  const renderMatchCard = (match: any) => (
    <Card key={match.id} className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-primary" />
              {match.donations?.title}
            </CardTitle>
            <CardDescription className="mt-2">
              {match.donations?.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="gap-1">
              Rank #{match.priority_rank}
            </Badge>
            <Badge variant="default" className="gap-1">
              {match.match_score}% Match
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-4">
        {/* Donation Details */}
        <div>
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Donation Details
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Type:</span>
              <p className="font-medium">{match.donations?.donation_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Condition:</span>
              <p className="font-medium">{match.donations?.condition}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Quantity:</span>
              <p className="font-medium">{match.donations?.available_quantity}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Location:</span>
              <p className="font-medium">{match.donations?.city}, {match.donations?.province}</p>
            </div>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-muted-foreground">From:</span>
            <p className="font-medium">{match.donations?.donors?.full_name}</p>
          </div>
        </div>

        {/* School Details */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <School className="h-4 w-4 text-primary" />
            Matched School
          </h4>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h5 className="font-semibold">{match.schools?.school_name}</h5>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />
                {match.schools?.total_students} students
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <MapPin className="h-3 w-3" />
              {match.schools?.district}, {match.schools?.province}
            </p>
            <div className="text-sm">
              <span className="font-medium">Contact:</span> {match.schools?.head_teacher_name} - {match.schools?.head_teacher_phone}
            </div>
          </div>
        </div>

        {/* Application Details */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Application: {match.resource_applications?.application_title}</h4>
          <div className="space-y-2">
            <div className="flex gap-2">
              <Badge>{match.resource_applications?.application_type}</Badge>
              <Badge variant="secondary">{match.resource_applications?.priority_level} priority</Badge>
              <Badge variant="outline">
                {match.resource_applications?.beneficiaries_count} beneficiaries
              </Badge>
            </div>
            {match.resource_applications?.current_situation && (
              <div className="text-sm">
                <span className="font-medium">Current Situation:</span>
                <p className="text-muted-foreground mt-1">{match.resource_applications.current_situation}</p>
              </div>
            )}
            {match.resource_applications?.expected_impact && (
              <div className="text-sm">
                <span className="font-medium">Expected Impact:</span>
                <p className="text-muted-foreground mt-1">{match.resource_applications.expected_impact}</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Justification */}
        <div className="pt-4 border-t bg-gradient-to-r from-blue-50 to-purple-50 -mx-6 px-6 py-4">
          <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            AI Recommendation
          </h4>
          <p className="text-sm">{match.match_justification}</p>
        </div>

        {/* Admin Notes */}
        {match.admin_notes && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Admin Notes</h4>
            <p className="text-sm text-muted-foreground">{match.admin_notes}</p>
          </div>
        )}

        {/* Admin who allocated */}
        <div className="text-xs text-muted-foreground">
          Allocated by: {match.allocated_by_profile?.full_name || match.allocated_by_profile?.email}
          {match.allocated_at && ` on ${new Date(match.allocated_at).toLocaleDateString()}`}
        </div>

        {/* Actions */}
        <div className="pt-4 border-t flex gap-3">
          <Button
            onClick={() => handleApprove(match.id)}
            disabled={processing}
            className="flex-1 gap-2"
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Approve Match
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setSelectedMatch(match);
              setShowRejectDialog(true);
            }}
            disabled={processing}
            className="flex-1 gap-2"
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Match Approvals</h2>
        <p className="text-muted-foreground mt-2">
          Review and approve AI-recommended donation-school matches
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <CardTitle>Your Role</CardTitle>
          </div>
          <CardDescription>
            As an approver, you provide independent review of admin allocations to prevent bias and ensure fair distribution of donations to schools.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="relative">
            Pending Review
            {pendingMatches.length > 0 && (
              <span className="ml-2 bg-orange-100 text-orange-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {pendingMatches.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin mb-4" />
                <p className="text-muted-foreground">Loading matches...</p>
              </CardContent>
            </Card>
          ) : pendingMatches.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending matches to review</p>
              </CardContent>
            </Card>
          ) : (
            pendingMatches.map(renderMatchCard)
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin mb-4" />
                <p className="text-muted-foreground">Loading history...</p>
              </CardContent>
            </Card>
          ) : matchHistory.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground">No match history yet</p>
              </CardContent>
            </Card>
          ) : (
            matchHistory.map((match) => (
              <Card key={match.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{match.donations?.title} → {match.schools?.school_name}</CardTitle>
                    <Badge variant={match.status === "approved_by_approver" ? "default" : "destructive"}>
                      {match.status === "approved_by_approver" ? "Approved" : "Rejected"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {match.reviewed_at && new Date(match.reviewed_at).toLocaleString()}
                  </CardDescription>
                </CardHeader>
                {(match.approver_notes || match.rejection_reason) && (
                  <CardContent>
                    {match.rejection_reason && (
                      <div className="text-sm">
                        <span className="font-medium">Rejection Reason:</span>
                        <p className="text-muted-foreground mt-1">{match.rejection_reason}</p>
                      </div>
                    )}
                    {match.approver_notes && (
                      <div className="text-sm mt-2">
                        <span className="font-medium">Notes:</span>
                        <p className="text-muted-foreground mt-1">{match.approver_notes}</p>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Match</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this match. The donation will be returned to the admin for reallocation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Rejection Reason <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Explain why this match is not suitable..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Additional Notes (Optional)
              </label>
              <Textarea
                placeholder="Any additional comments..."
                value={approverNotes}
                onChange={(e) => setApproverNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
