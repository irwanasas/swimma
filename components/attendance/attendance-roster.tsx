"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { markAttendanceForm, updateBookingNotesForm } from "@/lib/actions/attendance";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AttendanceBooking {
  id: string;
  isAttended: boolean;
  notes: string | null;
  childName: string;
}

export function AttendanceRoster({
  classId,
  bookings,
}: {
  classId: string;
  bookings: AttendanceBooking[];
}) {
  const [search, setSearch] = useState("");
  const attendedCount = bookings.filter((b) => b.isAttended).length;

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bookings;
    return bookings.filter((b) => b.childName.toLowerCase().includes(term));
  }, [bookings, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Badge variant={bookings.length > 0 && attendedCount === bookings.length ? "success" : "secondary"}>
          {attendedCount} / {bookings.length} Hadir
        </Badge>
      </div>

      {bookings.length > 5 ? (
        <Input
          placeholder="Cari nama anak..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      ) : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Anak</TableHead>
            <TableHead>Kehadiran</TableHead>
            <TableHead>Catatan (opsional)</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visible.map((b) => (
            <TableRow key={b.id}>
              <TableCell className="font-medium">{b.childName}</TableCell>
              <TableCell>
                <Badge variant={b.isAttended ? "success" : "outline"}>
                  {b.isAttended ? "Hadir" : "Belum Hadir"}
                </Badge>
              </TableCell>
              <TableCell>
                <form action={updateBookingNotesForm}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input type="hidden" name="classId" value={classId} />
                  <Input
                    name="notes"
                    defaultValue={b.notes ?? ""}
                    placeholder="Tambahkan catatan..."
                    className="min-w-40"
                    onBlur={(e) => {
                      if (e.target.value === (b.notes ?? "")) return;
                      toast.success("Catatan disimpan");
                      e.currentTarget.form?.requestSubmit();
                    }}
                  />
                </form>
              </TableCell>
              <TableCell>
                <form action={markAttendanceForm}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input type="hidden" name="classId" value={classId} />
                  <input type="hidden" name="isAttended" value={(!b.isAttended).toString()} />
                  <Button type="submit" size="sm" variant={b.isAttended ? "outline" : "default"}>
                    {b.isAttended ? "Tandai Belum Hadir" : "Tandai Hadir"}
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
          {visible.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                {bookings.length === 0
                  ? "Belum ada peserta terdaftar di kelas ini."
                  : "Tidak ada anak yang cocok dengan pencarian."}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  );
}
