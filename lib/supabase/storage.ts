import { createClient } from "./client";

export type UploadResult = {
  url: string | null;
  error: string | null;
};

export type UploadProgressCallback = (progress: number) => void;

/**
 * Uploads a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name
 * @param folder - The folder path within the bucket
 * @param fileName - Optional custom file name (will generate unique name if not provided)
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns The public URL of the uploaded file or an error
 */
export async function uploadFile(
  file: File,
  bucket: string,
  folder: string,
  fileName?: string,
  onProgress?: UploadProgressCallback
): Promise<UploadResult> {
  try {
    const supabase = createClient();

    // Generate unique file name if not provided
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const fileExt = file.name.split(".").pop();
    const finalFileName =
      fileName || `${timestamp}_${randomString}.${fileExt}`;

    const filePath = `${folder}/${finalFileName}`;

    // Simulate upload progress
    if (onProgress) {
      onProgress(0);
      // Small delay to show initial state
      await new Promise(resolve => setTimeout(resolve, 100));
      onProgress(30);
    }

    // Upload file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (onProgress) {
      onProgress(70);
    }

    if (uploadError) {
      console.error("Upload error:", uploadError);
      if (onProgress) onProgress(0);
      return { url: null, error: uploadError.message };
    }

    if (onProgress) {
      onProgress(90);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(filePath);

    if (onProgress) {
      onProgress(100);
    }

    return { url: filePath, error: null }; // Return path instead of public URL for storage reference
  } catch (error) {
    console.error("Unexpected upload error:", error);
    return {
      url: null,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Uploads multiple school document files
 * @param userId - The user ID (used for folder organization)
 * @param files - Object containing the files to upload
 * @param onProgress - Optional object with progress callbacks for each file
 * @returns Object containing URLs for each uploaded file
 */
export async function uploadSchoolDocuments(
  userId: string,
  files: {
    registrationCertificate: File;
    headTeacherId: File;
    schoolPhoto: File;
    classroomPhoto: File;
    additionalDocument?: File | null;
  },
  onProgress?: {
    registrationCertificate?: UploadProgressCallback;
    headTeacherId?: UploadProgressCallback;
    schoolPhoto?: UploadProgressCallback;
    classroomPhoto?: UploadProgressCallback;
    additionalDocument?: UploadProgressCallback;
  }
): Promise<{
  registrationCertificateUrl: string | null;
  headTeacherIdUrl: string | null;
  schoolPhotoUrl: string | null;
  classroomPhotoUrl: string | null;
  additionalDocumentUrl: string | null;
  errors: string[];
}> {
  const errors: string[] = [];
  const results = {
    registrationCertificateUrl: null as string | null,
    headTeacherIdUrl: null as string | null,
    schoolPhotoUrl: null as string | null,
    classroomPhotoUrl: null as string | null,
    additionalDocumentUrl: null as string | null,
    errors: [] as string[],
  };

  // Upload registration certificate
  const regCertResult = await uploadFile(
    files.registrationCertificate,
    "school-documents",
    userId,
    "registration_certificate",
    onProgress?.registrationCertificate
  );
  if (regCertResult.error) {
    errors.push(`Registration certificate: ${regCertResult.error}`);
  } else {
    results.registrationCertificateUrl = regCertResult.url;
  }

  // Upload head teacher ID
  const headIdResult = await uploadFile(
    files.headTeacherId,
    "school-documents",
    userId,
    "head_teacher_id",
    onProgress?.headTeacherId
  );
  if (headIdResult.error) {
    errors.push(`Head teacher ID: ${headIdResult.error}`);
  } else {
    results.headTeacherIdUrl = headIdResult.url;
  }

  // Upload school photo
  const schoolPhotoResult = await uploadFile(
    files.schoolPhoto,
    "school-documents",
    userId,
    "school_photo",
    onProgress?.schoolPhoto
  );
  if (schoolPhotoResult.error) {
    errors.push(`School photo: ${schoolPhotoResult.error}`);
  } else {
    results.schoolPhotoUrl = schoolPhotoResult.url;
  }

  // Upload classroom photo
  const classroomPhotoResult = await uploadFile(
    files.classroomPhoto,
    "school-documents",
    userId,
    "classroom_photo",
    onProgress?.classroomPhoto
  );
  if (classroomPhotoResult.error) {
    errors.push(`Classroom photo: ${classroomPhotoResult.error}`);
  } else {
    results.classroomPhotoUrl = classroomPhotoResult.url;
  }

  // Upload additional document (optional)
  if (files.additionalDocument) {
    const additionalDocResult = await uploadFile(
      files.additionalDocument,
      "school-documents",
      userId,
      "additional_document",
      onProgress?.additionalDocument
    );
    if (additionalDocResult.error) {
      errors.push(`Additional document: ${additionalDocResult.error}`);
    } else {
      results.additionalDocumentUrl = additionalDocResult.url;
    }
  }

  results.errors = errors;
  return results;
}

/**
 * Deletes a file from Supabase Storage
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file in the bucket
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage.from(bucket).remove([filePath]);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Gets the public URL for a file in storage
 * @param bucket - The storage bucket name
 * @param filePath - The path to the file in the bucket
 */
export function getPublicUrl(bucket: string, filePath: string): string {
  const supabase = createClient();
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return publicUrl;
}
