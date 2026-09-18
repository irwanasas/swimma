"use server";

import { revalidatePath } from "next/cache";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function markAttendanceForm(formData: FormData): Promise<void> {
  await requireActionRole("coach");
  const bookingId = String(formData.get("bookingId"));
  const classId = String(formData.get("classId"));
  const isAttended = formData.get("isAttended") === "true";

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("bookings")
    .update({
      is_attended: isAttended,
      attended_at: isAttended ? new Date().toISOString() : null,
    })
    .eq("id", bookingId);

  revalidatePath(`/coach/attendance/${classId}`);
}

export async function updateBookingNotesForm(formData: FormData): Promise<void> {
  await requireActionRole("coach");
  const bookingId = String(formData.get("bookingId"));
  const classId = String(formData.get("classId"));
  const notes = String(formData.get("notes") ?? "").trim();

  const supabase = await createServerSupabaseClient();
  await supabase
    .from("bookings")
    .update({ notes: notes || null })
    .eq("id", bookingId);

  revalidatePath(`/coach/attendance/${classId}`);
}
