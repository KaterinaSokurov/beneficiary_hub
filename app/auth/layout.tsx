export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-full max-h-screen w-full flex overflow-hidden">
      {/* Left side - Background image with overlay (fixed, non-scrollable) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5)), url("/auth.jpg")`
          }}
        />
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold leading-tight drop-shadow-lg">
              Empowering Education Through Community Support
            </h1>
            <p className="text-lg text-white/95 drop-shadow-md">
              A transparent platform connecting generous donors with schools in need across Harare Province.
            </p>
            <div className="space-y-4 pt-8">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold drop-shadow-md">Verified Donations</h3>
                  <p className="text-sm text-white/90 drop-shadow">Every resource listing is reviewed and approved by our admin team</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center drop-shadow-md">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold drop-shadow-md">Smart Matching</h3>
                  <p className="text-sm text-white/90 drop-shadow">Our system prioritizes schools based on urgency and student impact</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center drop-shadow-md">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold drop-shadow-md">Full Transparency</h3>
                  <p className="text-sm text-white/90 drop-shadow">Track every donation from listing to delivery with complete visibility</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth forms (scrollable) */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="min-h-full flex items-center justify-center p-6 lg:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}
