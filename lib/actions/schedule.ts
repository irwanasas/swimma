"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireActionRole } from "@/lib/auth/guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { classSchema } from "@/lib/validations/schedule";
import { type ActionState } from "./types";

export async function createClass(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");

  const parsed = classSchema.safeParse({
    instructorId: formData.get("instructorId"),
    locationId: formData.get("locationId"),
    classTypeId: formData.get("classTypeId"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    capacity: formData.get("capacity"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Data tidak valid" };
  }
  const input = parsed.data;
  const startIso = new Date(input.startTime).toISOString();
  const endIso = new Date(input.endTime).toISOString();

  const supabase = await createServerSupabaseClient();

  const { data: overlapping } = await supabase
    .from("classes")
    .select("id")
    .eq("instructor_id", input.instructorId)
    .lt("start_time", endIso)
    .gt("end_time", startIso)
    .limit(1);

  if (overlapping && overlapping.length > 0) {
    return { ok: false, error: "Pelatih sudah memiliki kelas lain pada waktu tersebut" };
  }

  const { error } = await supabase.from("classes").insert({
    instructor_id: input.instructorId,
    location_id: input.locationId,
    class_type_id: input.classTypeId,
    start_time: startIso,
    end_time: endIso,
    capacity: input.capacity,
  });

  if (error) {
    if (error.code === "23P01") {
      return { ok: false, error: "Pelatih sudah memiliki kelas lain pada waktu tersebut" };
    }
    return { ok: false, error: "Gagal menyimpan jadwal" };
  }

  revalidatePath("/admin/schedule");
  return { ok: true };
}

export async function deleteClassForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const classId = String(formData.get("classId"));
  const supabase = await createServerSupabaseClient();
  await supabase.from("classes").delete().eq("id", classId);
  revalidatePath("/admin/schedule");
  redirect("/admin/schedule");
}

export async function addBooking(
  classId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireActionRole("admin");
  const childId = String(formData.get("childId") ?? "");
  if (!childId) {
    return { ok: false, error: "Pilih anak yang akan didaftarkan" };
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("bookings").insert({ child_id: childId, class_id: classId });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Anak ini sudah terdaftar di kelas ini" };
    }
    if (error.message?.includes("class is full")) {
      return { ok: false, error: "Kelas sudah penuh" };
    }
    return { ok: false, error: "Gagal menambahkan anak ke kelas" };
  }

  revalidatePath(`/admin/schedule/${classId}`);
  return { ok: true };
}

export async function removeBookingForm(formData: FormData): Promise<void> {
  await requireActionRole("admin");
  const bookingId = String(formData.get("bookingId"));
  const classId = String(formData.get("classId"));
  const supabase = await createServerSupabaseClient();
  await supabase.from("bookings").delete().eq("id", bookingId);
  revalidatePath(`/admin/schedule/${classId}`);
}
