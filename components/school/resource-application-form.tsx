"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createResourceApplication, updateResourceApplication, type ResourceItem } from "@/app/actions/resource-applications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  FileText,
  TrendingUp,
  Users,
  Calendar
} from "lucide-react";

const APPLICATION_TYPES = [
  "Infrastructure",
  "Educational Materials",
  "Technology",
  "Food & Nutrition",
  "Sports Equipment",
  "Other"
];

const RESOURCE_CATEGORIES = [
  "Classroom Furniture",
  "Teaching Materials",
  "Textbooks",
  "Computers & Technology",
  "Sports Equipment",
  "Infrastructure Repair",
  "Food & Nutrition",
  "Medical Supplies",
  "Laboratory Equipment",
  "Library Books",
  "Other"
];

interface ResourceApplicationFormProps {
  schoolId: string;
  existingApplication?: any;
  isEdit?: boolean;
}

export function ResourceApplicationForm({
  schoolId,
  existingApplication,
  isEdit = false
}: ResourceApplicationFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [applicationTitle, setApplicationTitle] = useState(existingApplication?.application_title || "");
  const [applicationType, setApplicationType] = useState(existingApplication?.application_type || "");
  const [currentSituation, setCurrentSituation] = useState(existingApplication?.current_situation || "");
  const [expectedImpact, setExpectedImpact] = useState(existingApplication?.expected_impact || "");
  const [beneficiariesCount, setBeneficiariesCount] = useState(existingApplication?.beneficiaries_count || 0);
  const [neededByDate, setNeededByDate] = useState(existingApplication?.needed_by_date || "");
  const [implementationTimeline, setImplementationTimeline] = useState(existingApplication?.implementation_timeline || "");

  const [resourceItems, setResourceItems] = useState<ResourceItem[]>(
    existingApplication?.resources_needed || [
      { category: "", item: "", quantity: 1, description: "" }
    ]
  );

  const addResourceItem = () => {
    setResourceItems([
      ...resourceItems,
      { category: "", item: "", quantity: 1, description: "" }
    ]);
  };

  const removeResourceItem = (index: number) => {
    setResourceItems(resourceItems.filter((_, i) => i !== index));
  };

  const updateResourceItem = (index: number, field: keyof ResourceItem, value: any) => {
    const updated = [...resourceItems];
    updated[index] = { ...updated[index], [field]: value };
    setResourceItems(updated);
  };

  const handleSubmit = async (status: "draft" | "submitted") => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!applicationTitle.trim()) {
        setError("Please provide an application title");
        setLoading(false);
        return;
      }

      if (!applicationType) {
        setError("Please select an application type");
        setLoading(false);
        return;
      }

      if (status === "submitted") {
        if (!currentSituation.trim()) {
          setError("Current situation is required for submission");
          setLoading(false);
          return;
        }

        if (!expectedImpact.trim()) {
          setError("Expected impact is required for submission");
          setLoading(false);
          return;
        }

        if (resourceItems.length === 0 || resourceItems.some(item => !item.item.trim())) {
          setError("Please add at least one valid resource item");
          setLoading(false);
          return;
        }
      }

      const data = {
        application_title: applicationTitle,
        application_type: applicationType,
        resources_needed: resourceItems,
        current_situation: currentSituation,
        expected_impact: expectedImpact,
        beneficiaries_count: beneficiariesCount,
        needed_by_date: neededByDate || undefined,
        implementation_timeline: implementationTimeline || undefined,
      };

      let result;
      if (isEdit && existingApplication) {
        result = await updateResourceApplication(
          existingApplication.id,
          schoolId,
          data,
          status
        );
      } else {
        result = await createResourceApplication(schoolId, data, status);
      }

      if (!result.success) {
        setError(result.error || "Failed to save application");
        return;
      }

      setSuccess(
        status === "draft"
          ? "Application saved as draft successfully!"
          : "Application submitted successfully!"
      );

      setTimeout(() => {
        router.push("/school/applications");
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error("Error saving application:", err);
      setError(err instanceof Error ? err.message : "Failed to save application");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Provide the basic details of your resource application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="application_title">
              Application Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="application_title"
              value={applicationTitle}
              onChange={(e) => setApplicationTitle(e.target.value)}
              placeholder="e.g., Classroom Desks and Chairs for Grade 3"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="application_type">
              Application Type <span className="text-destructive">*</span>
            </Label>
            <Select value={applicationType} onValueChange={setApplicationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select application type" />
              </SelectTrigger>
              <SelectContent>
                {APPLICATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Needed */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Resources Needed
              </CardTitle>
              <CardDescription>
                List all resources you are requesting
              </CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addResourceItem}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {resourceItems.map((item, index) => (
            <Card key={index} className="border-2">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium">Resource Item #{index + 1}</h4>
                    {resourceItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeResourceItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => updateResourceItem(index, "category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {RESOURCE_CATEGORIES.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Item Name</Label>
                      <Input
                        value={item.item}
                        onChange={(e) => updateResourceItem(index, "item", e.target.value)}
                        placeholder="e.g., Student Desks"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateResourceItem(index, "quantity", parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={item.description}
                      onChange={(e) => updateResourceItem(index, "description", e.target.value)}
                      placeholder="Provide details about this resource item..."
                      rows={2}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Justification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Justification & Impact
          </CardTitle>
          <CardDescription>
            Explain why these resources are needed and their expected impact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current_situation">
              Current Situation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="current_situation"
              value={currentSituation}
              onChange={(e) => setCurrentSituation(e.target.value)}
              placeholder="Describe the current state and challenges..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected_impact">
              Expected Impact <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="expected_impact"
              value={expectedImpact}
              onChange={(e) => setExpectedImpact(e.target.value)}
              placeholder="How will these resources improve the situation?"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="beneficiaries_count">
              Number of Beneficiaries
            </Label>
            <Input
              id="beneficiaries_count"
              type="number"
              min="0"
              value={beneficiariesCount}
              onChange={(e) => setBeneficiariesCount(parseInt(e.target.value) || 0)}
              placeholder="How many students will benefit?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Timeline
          </CardTitle>
          <CardDescription>
            Provide timeline information for this request
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="needed_by_date">
              Needed By Date
            </Label>
            <Input
              id="needed_by_date"
              type="date"
              value={neededByDate}
              onChange={(e) => setNeededByDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="implementation_timeline">
              Implementation Timeline
            </Label>
            <Textarea
              id="implementation_timeline"
              value={implementationTimeline}
              onChange={(e) => setImplementationTimeline(e.target.value)}
              placeholder="How long will it take to implement/use these resources?"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/school/applications")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleSubmit("draft")}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save as Draft
        </Button>
        <Button
          type="button"
          onClick={() => handleSubmit("submitted")}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Application
        </Button>
      </div>
    </div>
  );
}
