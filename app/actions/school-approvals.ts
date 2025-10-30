"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendSchoolApprovalEmail, sendSchoolRejectionEmail } from "@/lib/email-service";

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

    // Get school details for email
    const { data: school, error: fetchError } = await supabase
      .from("schools")
      .select("school_name, id")
      .eq("id", schoolId)
      .single();

    if (fetchError || !school) {
      return { success: false, error: "School not found" };
    }

    // Get school email from profiles
    const { data: schoolProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", schoolId)
      .single();

    if (profileFetchError || !schoolProfile) {
      return { success: false, error: "School profile not found" };
    }

    const now = new Date().toISOString();
    const adminId = user.id;

    // Update school approval status in schools table
    const { error: schoolError } = await supabase
      .from("schools")
      .update({
        approval_status: "approved",
        is_verified: true,
        verified_by: adminId,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", schoolId);

    if (schoolError) {
      console.error("Error updating school:", schoolError);
      return { success: false, error: schoolError.message };
    }

    // IMPORTANT: Update profiles table - activate and verify the school profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_active: true,
        is_verified: true,
        verification_status: "approved",
        verified_by: adminId,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", schoolId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    // Send approval email
    await sendSchoolApprovalEmail(schoolProfile.email, school.school_name);

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

export async function rejectSchool(schoolId: string, reason: string = "Does not meet verification requirements") {
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

    // Get school details for email
    const { data: school, error: fetchError } = await supabase
      .from("schools")
      .select("school_name, id")
      .eq("id", schoolId)
      .single();

    if (fetchError || !school) {
      return { success: false, error: "School not found" };
    }

    // Get school email from profiles
    const { data: schoolProfile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", schoolId)
      .single();

    if (profileFetchError || !schoolProfile) {
      return { success: false, error: "School profile not found" };
    }

    const now = new Date().toISOString();
    const adminId = user.id;

    // Update school approval status in schools table with rejection
    const { error: schoolError } = await supabase
      .from("schools")
      .update({
        approval_status: "rejected",
        is_verified: false,
        verified_by: adminId,
        verified_at: now,
        rejection_reason: reason,
        updated_at: now,
      })
      .eq("id", schoolId);

    if (schoolError) {
      console.error("Error updating school:", schoolError);
      return { success: false, error: schoolError.message };
    }

    // IMPORTANT: Update profiles table - keep profile inactive and mark as rejected
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        is_active: false,
        is_verified: false,
        verification_status: "rejected",
        verified_by: adminId,
        verified_at: now,
        updated_at: now,
      })
      .eq("id", schoolId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    // Send rejection email
    await sendSchoolRejectionEmail(schoolProfile.email, school.school_name, reason);

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
