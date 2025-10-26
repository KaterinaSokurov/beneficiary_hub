"use server";

import { createClient } from "@/lib/supabase/server";

interface RegisterDonorData {
  email: string;
  password: string;
  full_name: string;
  phone_number: string;
  date_of_birth: string;
  occupation: string | null;
  address: string;
  city: string;
  state: string | null;
  country: string;
  postal_code: string | null;
  id_type: string;
  id_number: string;
  organization_name: string | null;
  // Financial/Tax
  tax_id: string | null;
  company_registration_number: string | null;
  // Preferences
  preferred_donation_categories: string[] | null;
  donation_frequency_preference: string | null;
  preferred_contact_method: string | null;
  newsletter_consent: boolean;
  // Background
  motivation_for_donating: string | null;
  connection_to_cause: string | null;
  previous_charitable_work: string | null;
  // Emergency Contact
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  // Legal
  terms_accepted: boolean;
  privacy_policy_accepted: boolean;
  aml_acknowledgment: boolean;
}

export async function registerDonor(data: RegisterDonorData) {
  try {
    const supabase = await createClient();

    // Create the auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.full_name,
          role: "donor",
        },
      },
    });

    if (signUpError) {
      console.error("Error creating auth user:", signUpError);
      return { success: false, error: signUpError.message };
    }

    if (!authData.user) {
      return { success: false, error: "Failed to create user account" };
    }

    // Create the basic profile entry
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: data.email,
        role: "donor",
        full_name: data.full_name,
        is_active: true,
      });

    if (profileError) {
      console.error("Error creating profile:", profileError);
      return { success: false, error: profileError.message };
    }

    // Create the donor-specific entry in donors table
    const { error: donorError } = await supabase
      .from("donors")
      .insert({
        id: authData.user.id,
        full_name: data.full_name,
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        occupation: data.occupation,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        postal_code: data.postal_code,
        id_type: data.id_type,
        id_number: data.id_number,
        organization_name: data.organization_name,
        // Financial/Tax
        tax_id: data.tax_id,
        company_registration_number: data.company_registration_number,
        // Preferences
        preferred_donation_categories: data.preferred_donation_categories,
        donation_frequency_preference: data.donation_frequency_preference,
        preferred_contact_method: data.preferred_contact_method,
        newsletter_consent: data.newsletter_consent,
        language_preference: "en",
        // Background
        motivation_for_donating: data.motivation_for_donating,
        connection_to_cause: data.connection_to_cause,
        previous_charitable_work: data.previous_charitable_work,
        // Emergency Contact
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        emergency_contact_relationship: data.emergency_contact_relationship,
        // Legal
        terms_accepted: data.terms_accepted,
        terms_accepted_at: data.terms_accepted ? new Date().toISOString() : null,
        privacy_policy_accepted: data.privacy_policy_accepted,
        privacy_policy_accepted_at: data.privacy_policy_accepted ? new Date().toISOString() : null,
        aml_acknowledgment: data.aml_acknowledgment,
        aml_acknowledged_at: data.aml_acknowledgment ? new Date().toISOString() : null,
        // Status
        verification_status: "pending",
        is_verified: false,
      });

    if (donorError) {
      console.error("Error creating donor record:", donorError);
      return { success: false, error: donorError.message };
    }

    return { success: true, userId: authData.user.id };
  } catch (error) {
    console.error("Error in registerDonor:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred",
    };
  }
}
