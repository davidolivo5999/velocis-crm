import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  available: "bg-emerald-100 text-emerald-700 border-emerald-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
  due_today: "bg-amber-100 text-amber-700 border-amber-200",
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  pending_pickup: "bg-purple-100 text-purple-700 border-purple-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  overdue: "bg-red-100 text-red-700 border-red-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  rented: "bg-blue-100 text-blue-700 border-blue-200",
  maintenance: "bg-orange-100 text-orange-700 border-orange-200",
  in_progress: "bg-blue-100 text-blue-700 border-blue-200",
  retired: "bg-gray-100 text-gray-600 border-gray-200",
  inactive: "bg-gray-100 text-gray-600 border-gray-200",
  partial: "bg-amber-100 text-amber-700 border-amber-200",
  refunded: "bg-purple-100 text-purple-700 border-purple-200",
};

const labelMap = {
  pending_pickup: "Pending Pickup",
  due_today: "Due Today",
  in_progress: "In Progress",
  oil_change: "Oil Change",
  tire_rotation: "Tire Rotation",
  brake_service: "Brake Service",
  engine_repair: "Engine Repair",
  ac_service: "A/C Service",
  body_work: "Body Work",
  credit_card: "Credit Card",
  debit_card: "Debit Card",
  bank_transfer: "Bank Transfer",
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const style = statusStyles[status] || "bg-gray-100 text-gray-600 border-gray-200";
  const label = labelMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <Badge variant="outline" className={cn("text-xs font-medium border", style)}>
      {label}
    </Badge>
  );
}