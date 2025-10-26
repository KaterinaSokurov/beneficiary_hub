"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Heart, School, Users, AlertCircle, Loader2 } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for error messages from middleware
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "inactive") {
      setError("Your account is pending approval. Please wait for admin activation.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // Successful login - refresh the page to trigger middleware
      // The middleware will check the user's role and redirect appropriately
      router.refresh();
      router.push("/");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard and continue making a difference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@beneficiaryhub.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="h-11"
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">
                Use the email address associated with your account
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="h-11"
                autoComplete="current-password"
              />
              <p className="text-xs text-muted-foreground">
                Enter your secure password
              </p>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <Separator className="my-6" />

          <div className="text-center space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Don&apos;t have an account?
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register-donor" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Register as Donor
                </Button>
              </Link>
              <Link href="/auth/signup-school" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full">
                  <School className="h-4 w-4 mr-2" />
                  Register School
                </Button>
              </Link>
            </div>

            {/* Platform Purpose */}
            <div className="pt-4 border-t space-y-3">
              <div className="text-center space-y-2">
                <p className="text-xs font-semibold text-foreground">Our Impact</p>
                <div className="flex justify-center gap-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-primary">50+</p>
                    <p className="text-xs text-muted-foreground">Schools Supported</p>
                  </div>
                  <div className="h-12 w-px bg-border" />
                  <div>
                    <p className="text-lg font-bold text-primary">200+</p>
                    <p className="text-xs text-muted-foreground">Resources Matched</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer info */}
      <p className="text-xs text-center text-muted-foreground">
        By signing in, you agree to our platform&apos;s terms of service
      </p>
    </div>
  );
}
