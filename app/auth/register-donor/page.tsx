import { DonorRegistrationForm } from "@/components/auth/donor-registration-form";

export default function DonorRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Donor Registration</h1>
          <p className="text-gray-600">
            Join our platform to make a difference. We prioritize trust and transparency.
          </p>
        </div>
        <DonorRegistrationForm />
      </div>
    </div>
  );
}
