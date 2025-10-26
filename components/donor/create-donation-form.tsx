"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Plus, X } from "lucide-react";
import { createDonation } from "@/app/actions/create-donation";

const donationSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  donationType: z.enum([
    "Food & Nutrition",
    "Educational Materials",
    "Infrastructure",
    "Technology",
    "Sports Equipment",
    "Furniture",
    "Stationery",
    "Other"
  ]),
  condition: z.enum(["New", "Like New", "Good", "Fair", "Acceptable"]),
  availableQuantity: z.number().min(1, "Quantity must be at least 1"),
  pickupLocation: z.string().min(5, "Pickup location is required"),
  city: z.string().min(2, "City is required"),
  province: z.string().min(2, "Province is required"),
  deliveryAvailable: z.boolean(),
  deliveryRadius: z.number().optional(),
  specialInstructions: z.string().optional(),
});

type DonationFormData = z.infer<typeof donationSchema>;

interface DonationItem {
  name: string;
  quantity: number;
  unit: string;
}

export function CreateDonationForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<DonationItem[]>([{ name: "", quantity: 1, unit: "piece" }]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      deliveryAvailable: false,
      availableQuantity: 1,
    },
  });

  const watchedValues = watch();

  const addItem = () => {
    setItems([...items, { name: "", quantity: 1, unit: "piece" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof DonationItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const onSubmit = async (data: DonationFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Validate items
      const validItems = items.filter(item => item.name.trim() !== "");
      if (validItems.length === 0) {
        setError("Please add at least one item");
        setLoading(false);
        return;
      }

      const result = await createDonation({
        ...data,
        items: validItems,
      });

      if (!result.success) {
        setError(result.error || "Failed to create donation");
        setLoading(false);
        return;
      }

      router.push("/donor/donations");
    } catch (err) {
      console.error("Donation creation error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Donation Details</CardTitle>
        <CardDescription>
          Provide information about the resources you'd like to donate
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="title">Donation Title *</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., 500 Textbooks for Primary Schools"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the items, their condition, and any other relevant details"
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="donationType">Donation Type *</Label>
                <Select
                  value={watchedValues.donationType}
                  onValueChange={(value) => setValue("donationType", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food & Nutrition">Food & Nutrition</SelectItem>
                    <SelectItem value="Educational Materials">Educational Materials</SelectItem>
                    <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Stationery">Stationery</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.donationType && (
                  <p className="text-sm text-destructive">{errors.donationType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={watchedValues.condition}
                  onValueChange={(value) => setValue("condition", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Like New">Like New</SelectItem>
                    <SelectItem value="Good">Good</SelectItem>
                    <SelectItem value="Fair">Fair</SelectItem>
                    <SelectItem value="Acceptable">Acceptable</SelectItem>
                  </SelectContent>
                </Select>
                {errors.condition && (
                  <p className="text-sm text-destructive">{errors.condition.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Items</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            {items.map((item, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Item name (e.g., Mathematics Textbook Grade 7)"
                      value={item.name}
                      onChange={(e) => updateItem(index, "name", e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                    />
                    <Select
                      value={item.unit}
                      onValueChange={(value) => updateItem(index, "unit", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="piece">Piece(s)</SelectItem>
                        <SelectItem value="box">Box(es)</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="liter">Liter(s)</SelectItem>
                        <SelectItem value="set">Set(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Location & Delivery */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location & Delivery</h3>

            <div className="space-y-2">
              <Label htmlFor="pickupLocation">Pickup Location *</Label>
              <Input
                id="pickupLocation"
                {...register("pickupLocation")}
                placeholder="Street address where items can be picked up"
              />
              {errors.pickupLocation && (
                <p className="text-sm text-destructive">{errors.pickupLocation.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input id="city" {...register("city")} placeholder="e.g., Harare" />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province *</Label>
                <Input id="province" {...register("province")} placeholder="e.g., Harare" />
                {errors.province && (
                  <p className="text-sm text-destructive">{errors.province.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="deliveryAvailable"
                checked={watchedValues.deliveryAvailable}
                onCheckedChange={(checked) => setValue("deliveryAvailable", checked as boolean)}
              />
              <Label htmlFor="deliveryAvailable" className="font-normal cursor-pointer">
                I can deliver these items
              </Label>
            </div>

            {watchedValues.deliveryAvailable && (
              <div className="space-y-2">
                <Label htmlFor="deliveryRadius">Delivery Radius (km)</Label>
                <Input
                  id="deliveryRadius"
                  type="number"
                  {...register("deliveryRadius", { valueAsNumber: true })}
                  placeholder="Maximum distance you can deliver"
                />
              </div>
            )}
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>

            <div className="space-y-2">
              <Label htmlFor="availableQuantity">Total Items Available *</Label>
              <Input
                id="availableQuantity"
                type="number"
                min="1"
                {...register("availableQuantity", { valueAsNumber: true })}
                placeholder="Total number of items"
              />
              {errors.availableQuantity && (
                <p className="text-sm text-destructive">{errors.availableQuantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                {...register("specialInstructions")}
                placeholder="Any special handling, pickup times, or other instructions"
                rows={3}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Create Donation"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
