"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { EyeOffIcon, EyeIcon } from "lucide-react";
import { IRegisterPayload } from "@/zod/auth.validation";
import { useMutation } from "@tanstack/react-query";
import { registerAction } from "../_actions/authActions";
import { useForm } from "@tanstack/react-form";

interface IRegisterFormProps {
  redirectPath?: string;
}

const RegisterForm = ({ redirectPath }: IRegisterFormProps) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [serverError, setServerError] = useState<string | null>(null);

  const { mutateAsync, isPending } = useMutation({
    mutationFn: (payload: IRegisterPayload) =>
      registerAction(payload, redirectPath),
  });

  const form = useForm({
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },

    onSubmit: async ({ value }) => {
      setServerError(null);
      
        const result = await mutateAsync(value);

        if (result.redirectPath) {
          window.location.href = result.redirectPath;
          return;
        }

        if (!result.success) {
          setServerError(result.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে");
        }
        
    },
  });

  return (
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
        {/* Username */}
        <form.Field name="username">
          {(field) => (
            <Field className="gap-2">
              <FieldLabel className="leading-5" htmlFor={field.name}>
                ইউজারনেম*
              </FieldLabel>
              <Input
                type="text"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="তোমার ইউজারনেম"
              />
            </Field>
          )}
        </form.Field>
        {/* Email */}
        <form.Field name="email">
          {(field) => (
            <Field className="gap-2">
              <FieldLabel className="leading-5" htmlFor={field.name}>
                ইমেইল*
              </FieldLabel>
              <Input
                type="email"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="তোমার ইমেইল ঠিকানা"
              />
            </Field>
          )}
        </form.Field>
        {/* Password */}
        <form.Field name="password">
          {(field) => (
            <Field className="w-full gap-2">
              <FieldLabel className="leading-5" htmlFor={field.name}>
                পাসওয়ার্ড*
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder="পাসওয়ার্ড"
                />
                <InputGroupAddon align="inline-end" className="pr-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setIsPasswordVisible((prevState) => !prevState)
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
        {/* Confirm Password */}
        <form.Field name="confirmPassword">
          {(field) => (
            <Field className="w-full gap-2">
              <FieldLabel className="leading-5" htmlFor={field.name}>
                পাসওয়ার্ড নিশ্চিত করো*
              </FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  type={isConfirmPasswordVisible ? "text" : "password"}
                  placeholder="পাসওয়ার্ড আবার দাও"
                />
                <InputGroupAddon align="inline-end" className="pr-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setIsConfirmPasswordVisible((prevState) => !prevState)
                    }
                    className="text-muted-foreground rounded-l-none hover:bg-transparent"
                  >
                    {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
                    <span className="sr-only">
                      {isConfirmPasswordVisible
                        ? "পাসওয়ার্ড লুকাও"
                        : "পাসওয়ার্ড দেখাও"}
                    </span>
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          )}
        </form.Field>
        <Field>
          <Button className="w-full" type="submit" disabled={isPending}>
            {isPending ? "তৈরি হচ্ছে..." : "একাউন্ট তৈরি করো →"}
          </Button>
        </Field>
        {serverError && (
          <p role="alert" className="text-destructive text-sm">
            {serverError}
          </p>
        )}
      </FieldGroup>
    </form>
  );
};

export default RegisterForm;
