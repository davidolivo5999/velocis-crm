import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CreditCard, Search, Filter, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

export default function Payments() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  const handleStripeCheckout = async (payment) => {
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      alert("Stripe checkout only works from the published app. Please open the app in a new tab.");
      return;
    }
    setStripeLoading(true);
    const res = await base44.functions.invoke("stripeCheckout", {
      amount: payment.total_amount,
      description: `Payment for ${payment.vehicle_name} — ${payment.customer_name}`,
      metadata: { payment_id: payment.id, rental_id: payment.rental_id },
    });
    setStripeLoading(false);
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
  };

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments"],
    queryFn: () => base44.entities.Payment.list("-created_date", 200),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Payment.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["payments"] }); setSelected(null); },
  });

  const filtered = payments.filter((p) => {
    const matchSearch = !search || p.customer_name?.toLowerCase().includes(search.toLowerCase()) || p.vehicle_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.total_amount || 0), 0);
  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.total_amount || 0), 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle={`$${totalPaid.toLocaleString()} collected • $${totalPending.toLocaleString()} pending`} />

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <Filter className="w-4 h-4 mr-2" /><SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CreditCard} title="No payments" description="Payments will appear here when rentals are created" />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="font-semibold text-right">Base Rate</TableHead>
                  <TableHead className="font-semibold text-right">Extras</TableHead>
                  <TableHead className="font-semibold text-right">Total</TableHead>
                  <TableHead className="font-semibold">Due Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelected(p)}>
                    <TableCell className="font-medium">{p.customer_name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.vehicle_name}</TableCell>
                    <TableCell className="text-right">${p.base_rate?.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">${p.extras_total || 0}</TableCell>
                    <TableCell className="text-right font-semibold">${p.total_amount?.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{p.due_date && format(new Date(p.due_date), "MMM d, yyyy")}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Payment Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Customer</span><span className="font-medium">{selected.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Base Rate</span><span>${selected.base_rate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Insurance</span><span>${selected.extras_insurance || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">GPS</span><span>${selected.extras_gps || 0}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Child Seat</span><span>${selected.extras_child_seat || 0}</span></div>
                <hr />
                <div className="flex justify-between font-bold text-base"><span>Total</span><span>${selected.total_amount}</span></div>
              </div>
              {selected.status !== "paid" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Mark as Paid (Manual)</Label>
                    <Select onValueChange={(method) => updateMutation.mutate({ id: selected.id, data: { status: "paid", paid_date: new Date().toISOString().split("T")[0], payment_method: method } })}>
                      <SelectTrigger><SelectValue placeholder="Select payment method..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative flex items-center gap-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => handleStripeCheckout(selected)}
                    disabled={stripeLoading}
                  >
                    {stripeLoading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <ExternalLink className="w-4 h-4" />
                    )}
                    Collect via Stripe
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}