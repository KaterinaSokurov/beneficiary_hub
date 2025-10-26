"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

interface EnrollUserData {
  email: string;
  password: string;
  full_name: string | null;
  phone_number: string | null;
  organization_name: string | null;
  role: "admin" | "approver";
}

export async function enrollUser(data: EnrollUserData) {
  try {
    const supabase = await createClient();

    // Verify the current user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Only admins can enroll users" };
    }

    // Create the auth user using the admin client
    const adminClient = createAdminClient();
    const { data: newUser, error: signUpError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // Auto-confirm the email
    });

    if (signUpError) {
      console.error("Error creating auth user:", signUpError);
      return { success: false, error: signUpError.message };
    }

    if (!newUser.user) {
      return { success: false, error: "Failed to create user" };
    }

    // Check if profile exists, if not create it
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("id", newUser.user.id)
      .single();

    if (!existingProfile) {
      // Create the profile
      const { error: insertError } = await adminClient
        .from("profiles")
        .insert({
          id: newUser.user.id,
          email: data.email,
          role: data.role,
          full_name: data.full_name,
          phone_number: data.phone_number,
          organization_name: data.organization_name,
          is_active: true,
        });

      if (insertError) {
        console.error("Error creating profile:", insertError);
        return { success: false, error: insertError.message };
      }
    } else {
      // Update the existing profile with the role and name
      const { error: updateError } = await adminClient
        .from("profiles")
        .update({
          role: data.role,
          full_name: data.full_name,
          phone_number: data.phone_number,
          organization_name: data.organization_name,
          is_active: true,
        })
        .eq("id", newUser.user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        return { success: false, error: updateError.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in enrollUser:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}

export async function toggleUserStatus(userId: string, newStatus: boolean) {
  try {
    const supabase = await createClient();

    // Verify the current user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return { success: false, error: "Only admins can update user status" };
    }

    // Update the user status
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_active: newStatus })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user status:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in toggleUserStatus:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
