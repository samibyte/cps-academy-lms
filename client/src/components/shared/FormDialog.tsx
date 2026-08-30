"use client";

import * as React from "react";
import { z } from "zod";
import {
  useForm,
  UseFormReturn,
  DefaultValues,
  FieldValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface FormDialogProps<TFieldValues extends FieldValues> {
  trigger: React.ReactElement;
  title: string;
  description?: string;
  schema: z.ZodType<any, any, any>;
  defaultValues: DefaultValues<TFieldValues>;
  onSubmit: (values: TFieldValues) => void | Promise<void>;
  children: (form: UseFormReturn<TFieldValues>) => React.ReactNode;
  submitText?: string;
  cancelText?: string;
  className?: string;
}

export function FormDialog<TFieldValues extends FieldValues>({
  trigger,
  title,
  description,
  schema,
  defaultValues,
  onSubmit,
  children,
  submitText = "Submit",
  cancelText = "Cancel",
  className,
}: FormDialogProps<TFieldValues>) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema) as any,
    defaultValues,
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [open, defaultValues, form]);

  const handleFormSubmit = async (values: TFieldValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      setOpen(false);
      form.reset();
    } catch (error) {
      console.error("Form dialog submission failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit as any)}
          className="space-y-4 py-2"
        >
          {children(form)}
          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : submitText}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
