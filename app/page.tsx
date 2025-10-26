import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function Home() {
  // Middleware handles redirecting authenticated users to their dashboard

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Beneficiary Hub
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Connecting donors with low-income schools in Harare Province
        </p>
        <p className="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">
          A transparent platform for resource sharing. Schools can post their needs,
          donors can list resources, and our system matches them based on urgency
          and availability.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/auth/login">
            <Button size="lg" className="w-full sm:w-auto">Login</Button>
          </Link>
          <Link href="/auth/register-donor">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Register as Donor
            </Button>
          </Link>
          <Link href="/auth/signup-school">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Register School
            </Button>
          </Link>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">For Donors</h3>
            <p className="text-gray-600 text-sm">
              List your resources (food, textbooks, furniture) and see them matched
              with schools that need them most.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">For Schools</h3>
            <p className="text-gray-600 text-sm">
              Post your urgent needs and get prioritized based on severity and
              student impact.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg mb-2">Transparent Process</h3>
            <p className="text-gray-600 text-sm">
              Admin-verified listings, automated matching, and tracked deliveries
              ensure accountability.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
