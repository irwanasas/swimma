"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/actions/types";

export function useActionToast(state: ActionState, defaultMessage: string) {
  useEffect(() => {
    if (state.ok) toast.success(state.message ?? defaultMessage);
  }, [state, defaultMessage]);
}
