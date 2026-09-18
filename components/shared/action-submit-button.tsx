"use client";

import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

export function ActionSubmitButton({
  confirmMessage,
  successMessage,
  onClick,
  ...props
}: ButtonProps & { confirmMessage?: string; successMessage?: string }) {
  return (
    <Button
      {...props}
      type="submit"
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
          return;
        }
        if (successMessage) toast.success(successMessage);
        onClick?.(event);
      }}
    />
  );
}
