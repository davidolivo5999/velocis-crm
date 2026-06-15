import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default function RentalTable({ rentals, onSelect }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Customer</TableHead>
              <TableHead className="font-semibold">Vehicle</TableHead>
              <TableHead className="font-semibold">Start</TableHead>
              <TableHead className="font-semibold">Return</TableHead>
              <TableHead className="font-semibold">Rate</TableHead>
              <TableHead className="font-semibold text-right">Total</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.map((r) => (
              <TableRow
                key={r.id}
                className="cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => onSelect?.(r)}
              >
                <TableCell className="font-medium">{r.customer_name}</TableCell>
                <TableCell className="text-muted-foreground">{r.vehicle_name}</TableCell>
                <TableCell className="text-sm">{r.start_date && format(new Date(r.start_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm">{r.return_date && format(new Date(r.return_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm capitalize">{r.rate_type}</TableCell>
                <TableCell className="text-right font-semibold">${r.total_amount?.toLocaleString()}</TableCell>
                <TableCell><StatusBadge status={r.status} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}