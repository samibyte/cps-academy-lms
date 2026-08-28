"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { ILoginPayload } from "@/zod/auth.validation";
import { useMutation } from "@tanstack/react-query";
import { loginAction } from "../_actions/authActions";
import { useForm } from "@tanstack/react-form";

interface ILoginFormProps {
  redirectPath?: string;
}

const LoginForm = ({ redirectPath }: ILoginFormProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: ILoginPayload) => loginAction(payload, redirectPath),
  });

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
      rememberMe: false,
    },

    onSubmit: async ({ value }) => {
      setServerError(null);
      const result = await mutateAsync(value);

      if (result.redirectPath) {
        window.location.href = result.redirectPath;
        return;
      }

      if (!result.success) {
        setServerError(result.message ?? "লগইন ব্যর্থ হয়েছে");
      }
    },
  });

  const handleQuickLogin = (role: "student" | "instructor" | "cmr" | "admin") => {
    const creds = {
      student: { identifier: "student", password: "Cps-academy1" },
      instructor: { identifier: "instructor", password: "Cps-academy1" },
      cmr: { identifier: "cmr", password: "Cps-academy1" },
      admin: { identifier: "admin", password: "Cps-academy1" },
    };
    const { identifier, password } = creds[role];
    form.setFieldValue("identifier", identifier);
    form.setFieldValue("password", password);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-muted-foreground mb-6 text-base">
          Login with <span className="text-primary"> Demo Credentials</span>
        </p>

        {/* Quick Login Buttons */}
        <div className="flex flex-wrap gap-4 sm:gap-6">
          <Button
            type="button"
            variant="outline"
            className="grow"
            onClick={() => handleQuickLogin("student")}
          >
            Student
          </Button>
          <Button
            type="button"
            variant="outline"
            className="grow"
            onClick={() => handleQuickLogin("instructor")}
          >
            Instructor
          </Button>
          <Button
            type="button"
            variant="outline"
            className="grow"
            onClick={() => handleQuickLogin("cmr")}
          >
            Content Manager
          </Button>
          <Button
            type="button"
            variant="outline"
            className="grow"
            onClick={() => handleQuickLogin("admin")}
          >
            Admin
          </Button>
        </div>
      </div>

      <form
        method="POST"
        action="#"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-4">
          {/* Identifier — username or email */}
          <form.Field name="identifier">
            {(field) => (
              <Field className="gap-2">
                <FieldLabel htmlFor={field.name} className="leading-5">
                  ইউজারনেম বা ইমেইল*
                </FieldLabel>
                <Input
                  type="text"
                  id={field.name}
                  name={field.name}
                  autoComplete="username"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="ইউজারনেম অথবা ইমেইল"
                />
              </Field>
            )}
          </form.Field>

          {/* Password */}
          <form.Field name="password">
            {(field) => (
              <Field className="w-full gap-2">
                <FieldLabel htmlFor={field.name} className="leading-5">
                  পাসওয়ার্ড*
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type={isPasswordVisible ? "text" : "password"}
                    placeholder="পাসওয়ার্ড"
                  />
                  <InputGroupAddon align="inline-end" className="pr-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setIsPasswordVisible((prev) => !prev)
                      }
                      className="text-muted-foreground rounded-l-none hover:bg-transparent"
                    >
                      {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                      <span className="sr-only">
                        {isPasswordVisible
                          ? "পাসওয়ার্ড লুকাও"
                          : "পাসওয়ার্ড দেখাও"}
                      </span>
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
              </Field>
            )}
          </form.Field>

          {/* Remember Me + Forgot Password */}
          <form.Field name="rememberMe">
            {(field) => (
              <div className="flex items-center justify-between gap-y-2">
                <Field orientation="horizontal" className="flex items-center gap-2">
                  <Checkbox
                    id={field.name}
                    checked={field.state.value}
                    onCheckedChange={(checked) =>
                      field.handleChange(checked === true)
                    }
                  />
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-muted-foreground"
                  >
                    মনে রাখো
                  </FieldLabel>
                </Field>
                <a href="#" className="text-base text-nowrap hover:underline">
                  পাসওয়ার্ড ভুলে গেছো?
                </a>
              </div>
            )}
          </form.Field>

          <Field>
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? "লগইন হচ্ছে..." : "লগইন করো →"}
            </Button>
          </Field>

          {serverError && (
            <p role="alert" className="text-destructive text-sm">
              {serverError}
            </p>
          )}
        </FieldGroup>
      </form>
    </div>
  );
};

export default LoginForm;
