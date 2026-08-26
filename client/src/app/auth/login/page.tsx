import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import LoginForm from "@/app/auth/_components/login-form";
import Logo from "@/components/shared/ui/logo";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface LoginParams {
  searchParams: Promise<{ redirect?: string }>;
}

const Login = async ({ searchParams }: LoginParams) => {
  const params = await searchParams;
  const redirectPath = params.redirect;

  return (
    <div className="relative flex h-auto min-h-screen items-center justify-center overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="absolute">
        <AuthBackgroundShape />
      </div>

      <Card className="z-1 w-full gap-6 py-6 sm:max-w-lg">
        <CardHeader className="gap-6 px-6">
          <Logo className="gap-3" />

          <div>
            <CardTitle className="mb-2 text-2xl font-semibold">
              আবার স্বাগতম
            </CardTitle>
            <CardDescription className="text-base">
              CPS Academy-তে লগইন করো এবং শেখা চালিয়ে যাও।
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          <p className="text-muted-foreground mb-6 text-base">
            Login with <span className="text-primary"> Demo Credentials</span>
          </p>

          {/* Quick Login Buttons */}
          <div className="mb-6 flex flex-wrap gap-4 sm:gap-6">
            <Button variant="outline" className="grow">
              User
            </Button>
            <Button variant="outline" className="grow">
              Instructor
            </Button>
            <Button variant="outline" className="grow">
              Content Manager
            </Button>
            <Button variant="outline" className="grow">
              Admin
            </Button>
          </div>
          {/* Login Form */}
          <div className="space-y-4">
            <LoginForm redirectPath={redirectPath} />

            <p className="text-muted-foreground text-center text-base">
              একাউন্ট নেই?{" "}
              <Link
                href="/auth/register"
                className="text-card-foreground hover:underline"
              >
                একাউন্ট তৈরি করো
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
