"use client";

import { useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  type: "search" | "select";
  name: string;
  placeholder: string;
  options?: FilterOption[];
}

export function ListFilters({ fields }: { fields: FilterField[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function updateParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(name, value);
    else params.delete(name);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function handleSearchChange(name: string, value: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam(name, value), 300);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {fields.map((field) =>
        field.type === "search" ? (
          <Input
            key={field.name}
            placeholder={field.placeholder}
            defaultValue={searchParams.get(field.name) ?? ""}
            onChange={(e) => handleSearchChange(field.name, e.target.value)}
            className="max-w-xs"
          />
        ) : (
          <Select
            key={field.name}
            defaultValue={searchParams.get(field.name) ?? ""}
            onChange={(e) => updateParam(field.name, e.target.value)}
            className="w-auto"
          >
            <option value="">{field.placeholder}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        )
      )}
    </div>
  );
}
