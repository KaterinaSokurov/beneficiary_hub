"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approveSchool(schoolId: string) {
  try {
    const supabase = await createClient();

    // Verify admin permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Update school approval status
    const { error: schoolError } = await supabase
      .from("schools")
      .update({
        approval_status: "approved",
        is_verified: true,
      })
      .eq("id", schoolId);

    if (schoolError) {
      console.error("Error updating school:", schoolError);
      return { success: false, error: schoolError.message };
    }

    // Activate the user profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_active: true })
      .eq("id", schoolId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    // Revalidate the admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/schools");

    return { success: true };
  } catch (err) {
    console.error("Error in approveSchool:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to approve school",
    };
  }
}

export async function rejectSchool(schoolId: string) {
  try {
    const supabase = await createClient();

    // Verify admin permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    // Update school approval status
    const { error: schoolError } = await supabase
      .from("schools")
      .update({
        approval_status: "rejected",
        is_verified: false,
      })
      .eq("id", schoolId);

    if (schoolError) {
      console.error("Error updating school:", schoolError);
      return { success: false, error: schoolError.message };
    }

    // Keep profile inactive
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ is_active: false })
      .eq("id", schoolId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    // Revalidate the admin pages
    revalidatePath("/admin");
    revalidatePath("/admin/schools");

    return { success: true };
  } catch (err) {
    console.error("Error in rejectSchool:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to reject school",
    };
  }
}
