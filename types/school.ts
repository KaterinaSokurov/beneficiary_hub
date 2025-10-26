// Shared types for school data across admin components

export type SchoolListView = {
  id: string;
  school_name: string;
  school_type: string;
  district: string;
  total_students: number;
  approval_status: string | null;
  is_verified: boolean | null;
  head_teacher_name: string;
  head_teacher_email: string | null;
  head_teacher_phone: string;
  created_at: string | null;
  registration_certificate_url: string | null;
  school_photo_url: string | null;
};

export type SchoolDetailView = {
  id: string;
  school_name: string;
  registration_number: string | null;
  school_type: string;
  province: string | null;
  district: string;
  ward: string | null;
  physical_address: string;
  gps_coordinates: string | null;
  head_teacher_name: string;
  head_teacher_phone: string;
  head_teacher_email: string | null;
  alternative_contact_name: string | null;
  alternative_contact_phone: string | null;
  total_students: number;
  male_students: number | null;
  female_students: number | null;
  total_teachers: number;
  grades_offered: string;
  has_electricity: boolean | null;
  has_running_water: boolean | null;
  has_library: boolean | null;
  has_computer_lab: boolean | null;
  number_of_classrooms: number | null;
  classroom_condition: string | null;
  has_feeding_program: boolean | null;
  feeding_program_details: string | null;
  students_requiring_meals: number | null;
  school_fees_amount: number | null;
  percentage_fee_paying: number | null;
  registration_certificate_url: string | null;
  head_teacher_id_url: string | null;
  school_photo_url: string | null;
  classroom_photo_url: string | null;
  additional_document_url: string | null;
  approval_status: string | null;
  is_verified: boolean | null;
  created_at: string | null;
};
