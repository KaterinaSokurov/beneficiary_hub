"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { UserRole } from "@/types/database.types";

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error, data: authData } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  // Get user profile to redirect to appropriate dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .single();

  revalidatePath("/", "layout");
  redirect(`/${profile?.role || "donor"}`);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("fullName") as string;
  const role = formData.get("role") as UserRole;
  const organizationName = formData.get("organizationName") as string | null;
  const phoneNumber = formData.get("phoneNumber") as string | null;

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "User creation failed" };
  }

  // Create profile
  // Note: For hybrid approach, donors and schools self-register but start as inactive
  // Only admins and approvers are created by admins directly
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    email,
    role,
    full_name: fullName,
    organization_name: organizationName,
    phone_number: phoneNumber,
    is_active: role === "admin" || role === "approver" ? true : false, // Donors/Schools need approval
    created_by: authData.user.id,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  if (role === "donor" || role === "school") {
    return {
      success: true,
      message:
        "Account created! Your account is pending approval. You'll receive an email once it's activated.",
    };
  }

  revalidatePath("/", "layout");
  redirect(`/${role}`);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/auth/login");
}
