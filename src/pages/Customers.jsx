import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, PlusCircle, Search, Star, Mail, Phone } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

export default function Customers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState(null);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setShowForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Customer.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setEditCustomer(null);
    },
  });

  const filtered = customers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle={`${customers.length} customers`}
        action={() => setShowForm(true)}
        actionLabel="Add Customer"
        actionIcon={PlusCircle}
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Add your first customer to get started"
          actionLabel="Add Customer"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Card
              key={c.id}
              className="p-5 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => setEditCustomer(c)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {c.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-sm flex items-center gap-1.5">
                      {c.name}
                      {c.is_vip && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">{c.total_rentals || 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Rentals</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold">${(c.total_spent || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Spent</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <div className="flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">{c.phone}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Customer Dialog */}
      <CustomerDialog
        open={showForm || !!editCustomer}
        onClose={() => { setShowForm(false); setEditCustomer(null); }}
        customer={editCustomer}
        onSave={(data) => {
          if (editCustomer) {
            updateMutation.mutate({ id: editCustomer.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function CustomerDialog({ open, onClose, customer, onSave, isSaving }) {
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "", address: "", drivers_license: "", is_vip: false, notes: "",
  });

  React.useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        drivers_license: customer.drivers_license || "",
        is_vip: customer.is_vip || false,
        notes: customer.notes || "",
      });
    } else {
      setForm({ name: "", email: "", phone: "", address: "", drivers_license: "", is_vip: false, notes: "" });
    }
  }, [customer, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Full Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <Label>Phone *</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label>Driver's License</Label>
            <Input value={form.drivers_license} onChange={(e) => setForm({ ...form, drivers_license: e.target.value })} />
          </div>
          <div className="flex items-center justify-between">
            <Label>VIP Customer</Label>
            <Switch checked={form.is_vip} onCheckedChange={(v) => setForm({ ...form, is_vip: v })} />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
          </div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSaving}>
            {isSaving ? "Saving..." : customer ? "Update Customer" : "Add Customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}