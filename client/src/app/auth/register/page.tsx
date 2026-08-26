import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthBackgroundShape from "@/assets/svg/auth-background-shape";
import RegisterForm from "@/app/auth/_components/register-form";
import Logo from "@/components/shared/ui/logo";
import Link from "next/link";

interface RegisterParams {
  searchParams: Promise<{ redirect?: string }>;
}

const Register = async ({ searchParams }: RegisterParams) => {
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
              একাউন্ট তৈরি করো
            </CardTitle>
            <CardDescription className="text-base">
              CPS Academy-তে তোমার শেখার যাত্রা শুরু করো।
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          {/* Register Form */}
          <div className="space-y-4">
            <RegisterForm redirectPath={redirectPath} />

            <p className="text-muted-foreground text-center">
              একাউন্ট আছে?{" "}
              <Link href="/auth/login" className="text-card-foreground hover:underline">
                লগইন করো
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
