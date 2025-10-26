"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSchoolInformation(schoolId: string, data: {
  school_name: string;
  school_type: string;
  registration_number: string;
  district: string;
  province: string;
  ward?: string;
  physical_address: string;
  gps_coordinates?: string;
  total_students: number;
  male_students?: number;
  female_students?: number;
  total_teachers: number;
  grades_offered: string;
  alternative_contact_name?: string;
  alternative_contact_phone?: string;
  has_electricity: boolean;
  has_running_water: boolean;
  has_library: boolean;
  has_computer_lab: boolean;
  number_of_classrooms?: number;
  classroom_condition?: string;
  has_feeding_program: boolean;
  feeding_program_details?: string;
  students_requiring_meals?: number;
  school_fees_amount?: number;
  percentage_fee_paying?: number;
}) {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "school") {
      return { success: false, error: "Unauthorized" };
    }

    // Update school information
    const { error: schoolError } = await supabase
      .from("schools")
      .update({
        school_name: data.school_name,
        school_type: data.school_type,
        registration_number: data.registration_number,
        district: data.district,
        province: data.province,
        ward: data.ward,
        physical_address: data.physical_address,
        gps_coordinates: data.gps_coordinates,
        total_students: data.total_students,
        male_students: data.male_students,
        female_students: data.female_students,
        total_teachers: data.total_teachers,
        grades_offered: data.grades_offered,
        alternative_contact_name: data.alternative_contact_name,
        alternative_contact_phone: data.alternative_contact_phone,
        has_electricity: data.has_electricity,
        has_running_water: data.has_running_water,
        has_library: data.has_library,
        has_computer_lab: data.has_computer_lab,
        number_of_classrooms: data.number_of_classrooms,
        classroom_condition: data.classroom_condition,
        has_feeding_program: data.has_feeding_program,
        feeding_program_details: data.feeding_program_details,
        students_requiring_meals: data.students_requiring_meals,
        school_fees_amount: data.school_fees_amount,
        percentage_fee_paying: data.percentage_fee_paying,
      })
      .eq("id", schoolId);

    if (schoolError) {
      console.error("Error updating school:", schoolError);
      return { success: false, error: schoolError.message };
    }

    // Revalidate the school pages
    revalidatePath("/school");
    revalidatePath("/school/settings");

    return { success: true };
  } catch (err) {
    console.error("Error in updateSchoolInformation:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update school information",
    };
  }
}

export async function updateSchoolDocuments(schoolId: string, formData: FormData) {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "school") {
      return { success: false, error: "Unauthorized" };
    }

    const updates: Record<string, string> = {};

    // Handle each document type
    const documentFields = [
      'registration_certificate',
      'head_teacher_id',
      'school_photo',
      'classroom_photo',
      'additional_document'
    ];

    for (const field of documentFields) {
      const file = formData.get(field) as File | null;

      if (file && file.size > 0) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${schoolId}/${field}_${Date.now()}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('school-documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading ${field}:`, uploadError);
          return { success: false, error: `Failed to upload ${field}: ${uploadError.message}` };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('school-documents')
          .getPublicUrl(fileName);

        updates[`${field}_url`] = urlData.publicUrl;
      }
    }

    // Update school with new document URLs
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from("schools")
        .update(updates)
        .eq("id", schoolId);

      if (updateError) {
        console.error("Error updating school documents:", updateError);
        return { success: false, error: updateError.message };
      }
    }

    // Revalidate the school pages
    revalidatePath("/school");
    revalidatePath("/school/settings");

    return { success: true };
  } catch (err) {
    console.error("Error in updateSchoolDocuments:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update documents",
    };
  }
}

export async function updateHeadTeacherProfile(schoolId: string, data: {
  full_name: string;
  head_teacher_name: string;
  head_teacher_email: string;
  head_teacher_phone: string;
}) {
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "school") {
      return { success: false, error: "Unauthorized" };
    }

    // Update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: data.full_name,
      })
      .eq("id", schoolId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    // Update school head teacher information
    const { error: schoolError } = await supabase
      .from("schools")
      .update({
        head_teacher_name: data.head_teacher_name,
        head_teacher_email: data.head_teacher_email,
        head_teacher_phone: data.head_teacher_phone,
      })
      .eq("id", schoolId);

    if (schoolError) {
      console.error("Error updating school:", schoolError);
      return { success: false, error: schoolError.message };
    }

    // Revalidate the school pages
    revalidatePath("/school");
    revalidatePath("/school/settings");

    return { success: true };
  } catch (err) {
    console.error("Error in updateHeadTeacherProfile:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update head teacher profile",
    };
  }
}
