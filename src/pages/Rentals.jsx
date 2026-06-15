import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import RentalTable from "@/components/rentals/RentalTable";
import EmptyState from "@/components/shared/EmptyState";
import { Car } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/shared/StatusBadge";
import { format } from "date-fns";

export default function Rentals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const { data: rentals = [], isLoading } = useQuery({
    queryKey: ["rentals"],
    queryFn: () => base44.entities.Rental.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Rental.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      setSelected(null);
    },
  });

  const filtered = rentals.filter((r) => {
    const matchSearch =
      !search ||
      r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.vehicle_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title="Rentals"
        subtitle={`${rentals.length} total rentals`}
        action={() => navigate("/new-rental")}
        actionLabel="New Rental"
        actionIcon={PlusCircle}
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer or vehicle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending_pickup">Pending Pickup</SelectItem>
            <SelectItem value="due_today">Due Today</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No rentals found"
          description="Create your first rental to get started"
          actionLabel="New Rental"
          onAction={() => navigate("/new-rental")}
        />
      ) : (
        <RentalTable rentals={filtered} onSelect={setSelected} />
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rental Details</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span><p className="font-medium">{selected.customer_name}</p></div>
                <div><span className="text-muted-foreground">Vehicle:</span><p className="font-medium">{selected.vehicle_name}</p></div>
                <div><span className="text-muted-foreground">Start:</span><p>{selected.start_date && format(new Date(selected.start_date), "MMM d, yyyy")}</p></div>
                <div><span className="text-muted-foreground">Return:</span><p>{selected.return_date && format(new Date(selected.return_date), "MMM d, yyyy")}</p></div>
                <div><span className="text-muted-foreground">Base Rate:</span><p>${selected.base_rate}</p></div>
                <div><span className="text-muted-foreground">Extras:</span><p>${selected.extras_total || 0}</p></div>
                <div><span className="text-muted-foreground">Total:</span><p className="font-bold text-lg">${selected.total_amount}</p></div>
                <div><span className="text-muted-foreground">Status:</span><p><StatusBadge status={selected.status} /></p></div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {selected.status === "pending_pickup" && (
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: selected.id, data: { status: "active" } })}>
                    Mark Active
                  </Button>
                )}
                {["active", "due_today", "overdue"].includes(selected.status) && (
                  <Button size="sm" onClick={() => updateMutation.mutate({ id: selected.id, data: { status: "completed", actual_return_date: new Date().toISOString().split("T")[0] } })}>
                    Mark Returned
                  </Button>
                )}
                {selected.status !== "cancelled" && selected.status !== "completed" && (
                  <Button size="sm" variant="destructive" onClick={() => updateMutation.mutate({ id: selected.id, data: { status: "cancelled" } })}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}