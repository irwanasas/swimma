"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface CashFlowPoint {
  month: string;
  cash_in: number;
  cash_out: number;
  net: number;
}

export function CashflowChart({ data }: { data: CashFlowPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey="cash_in" stroke="var(--color-success)" name="Masuk" strokeWidth={2} />
          <Line type="monotone" dataKey="cash_out" stroke="var(--color-destructive)" name="Keluar" strokeWidth={2} />
          <Line type="monotone" dataKey="net" stroke="var(--color-primary)" name="Bersih" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
