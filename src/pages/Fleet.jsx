import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CarFront, PlusCircle, Search, Gauge, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";

const CATEGORIES = ["economy", "compact", "midsize", "fullsize", "suv", "luxury", "van", "truck"];
const FUEL_TYPES = ["gasoline", "diesel", "hybrid", "electric"];

export default function Fleet() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list("-created_date", 200),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Vehicle.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setShowForm(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Vehicle.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["vehicles"] }); setEditVehicle(null); },
  });

  const filtered = vehicles.filter(
    (v) =>
      !search ||
      `${v.make} ${v.model}`.toLowerCase().includes(search.toLowerCase()) ||
      v.license_plate?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Fleet"
        subtitle={`${vehicles.length} vehicles`}
        action={() => setShowForm(true)}
        actionLabel="Add Vehicle"
        actionIcon={PlusCircle}
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search vehicles..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CarFront} title="No vehicles" description="Add your first vehicle to the fleet" actionLabel="Add Vehicle" onAction={() => setShowForm(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <Card key={v.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setEditVehicle(v)}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{v.year} {v.make} {v.model}</p>
                    <p className="text-xs text-muted-foreground capitalize">{v.category} • {v.color}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
                <p className="text-xs text-muted-foreground mb-3 font-mono">{v.license_plate}</p>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-bold">${v.daily_rate}</p>
                    <p className="text-[10px] text-muted-foreground">Daily</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-bold">${v.weekly_rate || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Weekly</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-sm font-bold">${v.monthly_rate || "—"}</p>
                    <p className="text-[10px] text-muted-foreground">Monthly</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Gauge className="w-3.5 h-3.5" />
                  <span>{(v.mileage || 0).toLocaleString()} mi</span>
                  <span className="ml-auto capitalize">{v.fuel_type}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <VehicleDialog
        open={showForm || !!editVehicle}
        onClose={() => { setShowForm(false); setEditVehicle(null); }}
        vehicle={editVehicle}
        onSave={(data) => {
          if (editVehicle) updateMutation.mutate({ id: editVehicle.id, data });
          else createMutation.mutate(data);
        }}
        isSaving={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

function VehicleDialog({ open, onClose, vehicle, onSave, isSaving }) {
  const [form, setForm] = React.useState({
    make: "", model: "", year: new Date().getFullYear(), license_plate: "", vin: "", color: "",
    category: "economy", daily_rate: 0, weekly_rate: 0, monthly_rate: 0, mileage: 0,
    fuel_type: "gasoline", status: "available", notes: "",
  });

  React.useEffect(() => {
    if (vehicle) {
      setForm({
        make: vehicle.make || "", model: vehicle.model || "", year: vehicle.year || new Date().getFullYear(),
        license_plate: vehicle.license_plate || "", vin: vehicle.vin || "", color: vehicle.color || "",
        category: vehicle.category || "economy", daily_rate: vehicle.daily_rate || 0,
        weekly_rate: vehicle.weekly_rate || 0, monthly_rate: vehicle.monthly_rate || 0,
        mileage: vehicle.mileage || 0, fuel_type: vehicle.fuel_type || "gasoline",
        status: vehicle.status || "available", notes: vehicle.notes || "",
      });
    } else {
      setForm({
        make: "", model: "", year: new Date().getFullYear(), license_plate: "", vin: "", color: "",
        category: "economy", daily_rate: 0, weekly_rate: 0, monthly_rate: 0, mileage: 0,
        fuel_type: "gasoline", status: "available", notes: "",
      });
    }
  }, [vehicle, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...form, year: Number(form.year), daily_rate: Number(form.daily_rate), weekly_rate: Number(form.weekly_rate), monthly_rate: Number(form.monthly_rate), mileage: Number(form.mileage) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{vehicle ? "Edit Vehicle" : "Add Vehicle"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Make *</Label><Input value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} required /></div>
            <div><Label>Model *</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Year *</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required /></div>
            <div><Label>License Plate *</Label><Input value={form.license_plate} onChange={(e) => setForm({ ...form, license_plate: e.target.value })} required /></div>
            <div><Label>Color</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fuel Type</Label>
              <Select value={form.fuel_type} onValueChange={(v) => setForm({ ...form, fuel_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FUEL_TYPES.map((f) => <SelectItem key={f} value={f} className="capitalize">{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Daily Rate ($) *</Label><Input type="number" min="0" step="0.01" value={form.daily_rate} onChange={(e) => setForm({ ...form, daily_rate: e.target.value })} required /></div>
            <div><Label>Weekly Rate ($)</Label><Input type="number" min="0" step="0.01" value={form.weekly_rate} onChange={(e) => setForm({ ...form, weekly_rate: e.target.value })} /></div>
            <div><Label>Monthly Rate ($)</Label><Input type="number" min="0" step="0.01" value={form.monthly_rate} onChange={(e) => setForm({ ...form, monthly_rate: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Mileage</Label><Input type="number" min="0" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} /></div>
            <div><Label>VIN</Label><Input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} /></div>
          </div>
          {vehicle && (
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="rented">Rented</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
          <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isSaving}>
            {isSaving ? "Saving..." : vehicle ? "Update Vehicle" : "Add Vehicle"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}