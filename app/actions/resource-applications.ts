"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type ResourceItem = {
  category: string;
  item: string;
  quantity: number;
  description: string;
};

export type ResourceApplicationData = {
  application_title: string;
  application_type: string;
  resources_needed: ResourceItem[];
  current_situation: string;
  expected_impact: string;
  beneficiaries_count: number;
  needed_by_date?: string;
  implementation_timeline?: string;
};

export async function createResourceApplication(
  schoolId: string,
  data: ResourceApplicationData,
  status: "draft" | "submitted" = "draft"
) {
  try {
    const supabase = await createClient();

    // Verify school permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "school" || !profile.is_active) {
      return { success: false, error: "Unauthorized or inactive account" };
    }

    // Create the application
    const applicationData: any = {
      school_id: schoolId,
      application_title: data.application_title,
      application_type: data.application_type,
      resources_needed: data.resources_needed,
      current_situation: data.current_situation,
      expected_impact: data.expected_impact,
      beneficiaries_count: data.beneficiaries_count,
      needed_by_date: data.needed_by_date,
      implementation_timeline: data.implementation_timeline,
      status: status,
    };

    if (status === "submitted") {
      applicationData.submitted_at = new Date().toISOString();
    }

    const { data: application, error: applicationError } = await supabase
      .from("resource_applications")
      .insert(applicationData)
      .select()
      .single();

    if (applicationError) {
      console.error("Error creating application:", applicationError);
      return { success: false, error: applicationError.message };
    }

    // Revalidate the applications page
    revalidatePath("/school/applications");

    return { success: true, application };
  } catch (err) {
    console.error("Error in createResourceApplication:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create application",
    };
  }
}

export async function updateResourceApplication(
  applicationId: string,
  schoolId: string,
  data: Partial<ResourceApplicationData>,
  status?: "draft" | "submitted"
) {
  try {
    const supabase = await createClient();

    // Verify school permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if application belongs to school and is editable
    const { data: existingApp } = await supabase
      .from("resource_applications")
      .select("school_id, status")
      .eq("id", applicationId)
      .single();

    if (!existingApp || existingApp.school_id !== schoolId) {
      return { success: false, error: "Application not found" };
    }

    if (!["draft", "rejected"].includes(existingApp.status)) {
      return { success: false, error: "Cannot edit submitted application" };
    }

    const updateData: any = {};

    if (data.application_title) updateData.application_title = data.application_title;
    if (data.application_type) updateData.application_type = data.application_type;
    if (data.resources_needed) updateData.resources_needed = data.resources_needed;
    if (data.current_situation) updateData.current_situation = data.current_situation;
    if (data.expected_impact) updateData.expected_impact = data.expected_impact;
    if (data.beneficiaries_count !== undefined) updateData.beneficiaries_count = data.beneficiaries_count;
    if (data.needed_by_date !== undefined) updateData.needed_by_date = data.needed_by_date;
    if (data.implementation_timeline !== undefined) updateData.implementation_timeline = data.implementation_timeline;

    if (status) {
      updateData.status = status;
      if (status === "submitted") {
        updateData.submitted_at = new Date().toISOString();
      }
    }

    const { error: updateError } = await supabase
      .from("resource_applications")
      .update(updateData)
      .eq("id", applicationId);

    if (updateError) {
      console.error("Error updating application:", updateError);
      return { success: false, error: updateError.message };
    }

    // Revalidate the applications page
    revalidatePath("/school/applications");
    revalidatePath(`/school/applications/${applicationId}`);

    return { success: true };
  } catch (err) {
    console.error("Error in updateResourceApplication:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update application",
    };
  }
}

export async function deleteResourceApplication(
  applicationId: string,
  schoolId: string
) {
  try {
    const supabase = await createClient();

    // Verify school permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== schoolId) {
      return { success: false, error: "Unauthorized" };
    }

    // Check if application belongs to school and is draft
    const { data: existingApp } = await supabase
      .from("resource_applications")
      .select("school_id, status")
      .eq("id", applicationId)
      .single();

    if (!existingApp || existingApp.school_id !== schoolId) {
      return { success: false, error: "Application not found" };
    }

    if (existingApp.status !== "draft") {
      return { success: false, error: "Can only delete draft applications" };
    }

    const { error: deleteError } = await supabase
      .from("resource_applications")
      .delete()
      .eq("id", applicationId);

    if (deleteError) {
      console.error("Error deleting application:", deleteError);
      return { success: false, error: deleteError.message };
    }

    // Revalidate the applications page
    revalidatePath("/school/applications");

    return { success: true };
  } catch (err) {
    console.error("Error in deleteResourceApplication:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete application",
    };
  }
}

export async function getSchoolApplications(schoolId: string) {
  try {
    const supabase = await createClient();

    // Verify school permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== schoolId) {
      return { success: false, error: "Unauthorized", applications: [] };
    }

    const { data: applications, error } = await supabase
      .from("resource_applications")
      .select("*")
      .eq("school_id", schoolId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
      return { success: false, error: error.message, applications: [] };
    }

    return { success: true, applications: applications || [] };
  } catch (err) {
    console.error("Error in getSchoolApplications:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch applications",
      applications: [],
    };
  }
}

export async function getApplicationById(applicationId: string, schoolId: string) {
  try {
    const supabase = await createClient();

    // Verify school permissions
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== schoolId) {
      return { success: false, error: "Unauthorized", application: null };
    }

    const { data: application, error } = await supabase
      .from("resource_applications")
      .select("*")
      .eq("id", applicationId)
      .eq("school_id", schoolId)
      .single();

    if (error) {
      console.error("Error fetching application:", error);
      return { success: false, error: error.message, application: null };
    }

    return { success: true, application };
  } catch (err) {
    console.error("Error in getApplicationById:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to fetch application",
      application: null,
    };
  }
}
