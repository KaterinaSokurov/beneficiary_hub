"use server";

import { createClient } from "@/lib/supabase/server";

interface DonationItem {
  name: string;
  quantity: number;
  unit: string;
}

interface CreateDonationData {
  title: string;
  description: string;
  donationType: string;
  condition: string;
  availableQuantity: number;
  pickupLocation: string;
  city: string;
  province: string;
  deliveryAvailable: boolean;
  deliveryRadius?: number;
  specialInstructions?: string;
  items: DonationItem[];
}

export async function createDonation(data: CreateDonationData) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify user is a verified donor
    const { data: donor } = await supabase
      .from("donors")
      .select("is_verified, verification_status")
      .eq("id", user.id)
      .single();

    if (!donor || !donor.is_verified || donor.verification_status !== "approved") {
      return { success: false, error: "Only verified donors can create donations" };
    }

    // Create the donation
    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        donor_id: user.id,
        title: data.title,
        description: data.description,
        donation_type: data.donationType,
        category: [data.donationType.toLowerCase()],
        items: data.items as unknown as any,
        condition: data.condition,
        available_quantity: data.availableQuantity,
        pickup_location: data.pickupLocation,
        city: data.city,
        province: data.province,
        delivery_available: data.deliveryAvailable,
        delivery_radius_km: data.deliveryRadius || null,
        special_instructions: data.specialInstructions || null,
        status: "pending",
        approval_status: "pending",
      })
      .select()
      .single();

    if (donationError) {
      console.error("Error creating donation:", donationError);
      return { success: false, error: donationError.message };
    }

    return { success: true, donationId: donation.id };
  } catch (error) {
    console.error("Error in createDonation:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
