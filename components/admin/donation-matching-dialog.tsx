"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Brain, School, AlertCircle, CheckCircle, MapPin, Users } from "lucide-react";
import { generateMatchRecommendations, getMatchRecommendations, allocateDonationToSchool } from "@/app/actions/match-donations";
import { toast } from "sonner";

interface DonationMatchingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  donationId: string;
  donationTitle: string;
  onMatchAllocated?: () => void;
}

export function DonationMatchingDialog({
  open,
  onOpenChange,
  donationId,
  donationTitle,
  onMatchAllocated,
}: DonationMatchingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<any[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [allocating, setAllocating] = useState(false);

  const handleGenerateMatches = async () => {
    setLoading(true);
    try {
      const result = await generateMatchRecommendations(donationId);
      if (result.success && result.matches) {
        setMatches(result.matches);
        toast.success(`Generated ${result.matches.length} match recommendations`);
      } else {
        toast.error(result.error || "Failed to generate recommendations");
      }
    } catch (error) {
      toast.error("Error generating recommendations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMatches = async () => {
    setLoading(true);
    try {
      const result = await getMatchRecommendations(donationId);
      if (result.success && result.matches) {
        setMatches(result.matches);
      } else {
        toast.error(result.error || "Failed to load recommendations");
      }
    } catch (error) {
      toast.error("Error loading recommendations");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocate = async () => {
    if (!selectedMatch) {
      toast.error("Please select a match");
      return;
    }

    setAllocating(true);
    try {
      const result = await allocateDonationToSchool(selectedMatch, adminNotes);
      if (result.success) {
        toast.success("Donation allocated successfully! Awaiting approver confirmation.");
        onOpenChange(false);
        onMatchAllocated?.();
      } else {
        toast.error(result.error || "Failed to allocate donation");
      }
    } catch (error) {
      toast.error("Error allocating donation");
      console.error(error);
    } finally {
      setAllocating(false);
    }
  };

  const getPriorityColor = (rank: number) => {
    if (rank === 1) return "bg-green-100 text-green-800 border-green-300";
    if (rank === 2) return "bg-blue-100 text-blue-800 border-blue-300";
    if (rank === 3) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-gray-100 text-gray-800 border-gray-300";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI-Powered Donation Matching
          </DialogTitle>
          <DialogDescription>
            Find the best school match for: <strong>{donationTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {matches.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  No match recommendations generated yet. Click below to analyze school applications and generate AI-powered recommendations.
                </p>
                <Button onClick={handleGenerateMatches} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Applications...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Generate Match Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {matches.length} potential matches found, ranked by AI
                </p>
                <Button variant="outline" size="sm" onClick={handleGenerateMatches} disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Regenerate"
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {matches.map((match: any) => (
                  <Card
                    key={match.id || match.application_id}
                    className={`cursor-pointer transition-all ${
                      selectedMatch === (match.id || match.application_id)
                        ? "ring-2 ring-primary shadow-lg"
                        : "hover:shadow-md"
                    }`}
                    onClick={() => setSelectedMatch(match.id || match.application_id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <School className="h-4 w-4 text-primary" />
                            {match.schools?.school_name || match.school_name}
                            {selectedMatch === (match.id || match.application_id) && (
                              <CheckCircle className="h-5 w-5 text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {match.resource_applications?.application_title}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge className={getPriorityColor(match.priority_rank)}>
                            Rank #{match.priority_rank}
                          </Badge>
                          <Badge variant="secondary">
                            {match.match_score}% Match
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{match.schools?.district}, {match.schools?.province}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{match.schools?.total_students} students</span>
                        </div>
                        <div className="text-muted-foreground">
                          <strong>Type:</strong> {match.resource_applications?.application_type}
                        </div>
                        <div className="text-muted-foreground">
                          <strong>Priority:</strong> {match.resource_applications?.priority_level}
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
                          <Brain className="h-4 w-4" />
                          AI Analysis:
                        </p>
                        <p className="text-sm text-blue-800">{match.match_justification}</p>
                      </div>

                      {match.resource_applications?.current_situation && (
                        <div className="text-sm">
                          <p className="font-medium text-muted-foreground mb-1">Current Situation:</p>
                          <p className="text-sm">{match.resource_applications.current_situation}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedMatch && (
                <div className="space-y-3 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Admin Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add any notes about this allocation..."
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-sm flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <span className="text-yellow-800">
                        This allocation will be sent to an approver for final confirmation to prevent bias.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {matches.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAllocate}
              disabled={!selectedMatch || allocating}
            >
              {allocating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Allocating...
                </>
              ) : (
                "Allocate to Selected School"
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
