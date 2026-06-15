import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Car, Users, DollarSign, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "@/components/shared/StatCard";
import StatusBadge from "@/components/shared/StatusBadge";
import PageHeader from "@/components/shared/PageHeader";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: rentals = [] } = useQuery({
    queryKey: ["rentals"],
    queryFn: () => base44.entities.Rental.list("-created_date", 100),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });
  const { data: payments = [] } = useQuery({
    queryKey: ["payments"],
    queryFn: () => base44.entities.Payment.list("-created_date", 100),
  });

  const activeRentals = rentals.filter((r) => ["active", "due_today", "overdue"].includes(r.status));
  const availableVehicles = vehicles.filter((v) => v.status === "available");
  const now = new Date();
  const thisMonth = rentals.filter((r) => {
    const d = new Date(r.start_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthlyRevenue = thisMonth.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const pendingPayments = payments.filter((p) => p.status === "pending" || p.status === "overdue");
  const pendingTotal = pendingPayments.reduce((sum, p) => sum + (p.total_amount || 0), 0);

  const recentRentals = rentals.slice(0, 5);
  const overdueRentals = rentals.filter((r) => r.status === "overdue");

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of your rental business" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Active Rentals" value={activeRentals.length} icon={Car} trend={`${rentals.length} total`} trendUp />
        <StatCard title="Fleet Available" value={`${availableVehicles.length}/${vehicles.length}`} icon={CarIcon} />
        <StatCard title="Monthly Revenue" value={`$${monthlyRevenue.toLocaleString()}`} icon={DollarSign} trend="This month" trendUp />
        <StatCard title="Pending Payments" value={`$${pendingTotal.toLocaleString()}`} icon={Clock} trend={`${pendingPayments.length} invoices`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Rentals */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold">Recent Rentals</h3>
              <Link to="/rentals" className="text-xs text-accent font-medium hover:underline">View all</Link>
            </div>
          </div>
          <div className="divide-y divide-border">
            {recentRentals.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground text-center">No rentals yet</p>
            ) : (
              recentRentals.map((r) => (
                <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium">{r.customer_name}</p>
                    <p className="text-xs text-muted-foreground">{r.vehicle_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">${r.total_amount?.toLocaleString()}</span>
                    <StatusBadge status={r.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Overdue / Alerts */}
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-heading font-semibold">Alerts</h3>
            </div>
          </div>
          <div className="divide-y divide-border">
            {overdueRentals.length === 0 && pendingPayments.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground text-center">No alerts at this time</p>
            ) : (
              <>
                {overdueRentals.map((r) => (
                  <div key={r.id} className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <Car className="w-4 h-4 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Overdue: {r.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{r.vehicle_name} — Due {r.return_date && format(new Date(r.return_date), "MMM d")}</p>
                    </div>
                  </div>
                ))}
                {pendingPayments.slice(0, 3).map((p) => (
                  <div key={p.id} className="p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">Payment: {p.customer_name}</p>
                      <p className="text-xs text-muted-foreground">${p.total_amount} due {p.due_date && format(new Date(p.due_date), "MMM d")}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CarIcon(props) {
  return <TrendingUp {...props} />;
}