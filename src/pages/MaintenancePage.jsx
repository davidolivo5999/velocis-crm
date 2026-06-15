import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Wrench, PlusCircle, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { format } from "date-fns";

const SERVICE_TYPES = ["oil_change", "tire_rotation", "brake_service", "engine_repair", "transmission", "body_work", "ac_service", "inspection", "cleaning", "other"];

export default function MaintenancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: () => base44.entities.Maintenance.list("-created_date", 200),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Maintenance.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["maintenance"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Maintenance.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
  });

  const filtered = records.filter((r) =>
    !search || r.vehicle_name?.toLowerCase().includes(search.toLowerCase()) || r.service_type?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle={`${records.length} service records`}
        action={() => setShowForm(true)}
        actionLabel="Add Record"
        actionIcon={PlusCircle}
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search maintenance records..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Wrench} title="No records" description="Log your first maintenance record" actionLabel="Add Record" onAction={() => setShowForm(true)} />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">Vehicle</TableHead>
                  <TableHead className="font-semibold">Service</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold text-right">Cost</TableHead>
                  <TableHead className="font-semibold">Next Service</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">{r.vehicle_name}</TableCell>
                    <TableCell><StatusBadge status={r.service_type} /></TableCell>
                    <TableCell className="text-sm">{r.service_date && format(new Date(r.service_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right font-semibold">${r.cost?.toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.next_service_date ? format(new Date(r.next_service_date), "MMM d, yyyy") : "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                      {r.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 text-xs h-6"
                          onClick={() => updateMutation.mutate({ id: r.id, data: { status: "completed" } })}
                        >
                          Complete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Maintenance Record</DialogTitle></DialogHeader>
          <MaintenanceForm vehicles={vehicles} onSave={(data) => createMutation.mutate(data)} isSaving={createMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MaintenanceForm({ vehicles, onSave, isSaving }) {
  const [form, setForm] = React.useState({
    vehicle_id: "", vehicle_name: "", service_type: "oil_change", description: "",
    service_date: new Date().toISOString().split("T")[0], cost: 0, next_service_date: "", performed_by: "",
    status: "scheduled", notes: "",
  });

  const handleVehicle = (id) => {
    const v = vehicles.find((v) => v.id === id);
    setForm({ ...form, vehicle_id: id, vehicle_name: v ? `${v.year} ${v.make} ${v.model}` : "" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, cost: Number(form.cost) });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Vehicle *</Label>
        <Select value={form.vehicle_id} onValueChange={handleVehicle}>
          <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
          <SelectContent>{vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.year} {v.make} {v.model}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Service Type *</Label>
        <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{SERVICE_TYPES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Service Date *</Label><Input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} required /></div>
        <div><Label>Cost ($) *</Label><Input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required /></div>
      </div>
      <div><Label>Next Service Date</Label><Input type="date" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} /></div>
      <div><Label>Performed By</Label><Input value={form.performed_by} onChange={(e) => setForm({ ...form, performed_by: e.target.value })} /></div>
      <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSaving || !form.vehicle_id}>
        {isSaving ? "Saving..." : "Add Record"}
      </Button>
    </form>
  );
}