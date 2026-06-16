import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, CreditCard } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import PriceCalculator, { calculatePrice } from "@/components/rentals/PriceCalculator";

export default function NewRental() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("name", 500),
  });
  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list("make", 500),
  });
  const { data: staff = [] } = useQuery({
    queryKey: ["staff"],
    queryFn: () => base44.entities.Staff.filter({ status: "active" }),
  });

  const { data: rentalSettings = {} } = useQuery({
    queryKey: ["rentalSettings"],
    queryFn: async () => {
      const settings = await base44.entities.RentalSettings.list();
      return settings[0] || {};
    },
  });

  const extraRates = {
    insurance: rentalSettings.insurance_daily_rate ?? 15,
    gps: rentalSettings.gps_daily_rate ?? 5,
    childSeat: rentalSettings.child_seat_daily_rate ?? 8,
    chauffeur: rentalSettings.luxury_chauffeur_daily_rate ?? 100,
  };

  const availableVehicles = vehicles.filter((v) => v.status === "available");

  const [form, setForm] = useState({
    customer_id: "",
    vehicle_id: "",
    start_date: new Date().toISOString().split("T")[0],
    return_date: "",
    rate_type: "daily",
    insurance: false,
    gps: false,
    child_seat: false,
    chauffeur: false,
    staff_id: "",
    notes: "",
  });

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicle_id);
  const selectedCustomer = customers.find((c) => c.id === form.customer_id);
  const selectedStaff = staff.find((s) => s.id === form.staff_id);

  const pricing = useMemo(() => {
    return calculatePrice({
      vehicle: selectedVehicle,
      rateType: form.rate_type,
      startDate: form.start_date,
      returnDate: form.return_date,
      insurance: form.insurance,
      gps: form.gps,
      childSeat: form.child_seat,
      chauffeur: form.chauffeur,
      extraRates,
      customerBirthDate: selectedCustomer?.birth_date,
      birthdayDiscountPercent: rentalSettings.birthday_discount_percentage || 10,
    });
  }, [selectedVehicle, form.rate_type, form.start_date, form.return_date, form.insurance, form.gps, form.child_seat, form.chauffeur, extraRates, selectedCustomer?.birth_date, rentalSettings.birthday_discount_percentage]);

  const validateRentalData = (data) => {
    if (!data.customer_id || !data.vehicle_id) return "Customer and vehicle are required";
    if (!data.start_date || !data.return_date) return "Start and return dates are required";
    if (new Date(data.return_date) <= new Date(data.start_date)) return "Return date must be after start date";
    if (!Number.isFinite(data.total_amount) || data.total_amount <= 0) return "Invalid total amount";
    return "";
  };

  const handleStripeCheckout = async (rental, payment) => {
    // Validate payment data before stripe
    if (!Number.isFinite(payment.total_amount) || payment.total_amount <= 0) {
      alert("Invalid payment amount");
      return;
    }

    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      alert("Stripe checkout only works from the published app. Please open the app in a new tab.");
      return;
    }

    try {
      const res = await base44.functions.invoke("stripeCheckout", {
        amount: Math.round(payment.total_amount * 100) / 100,
        description: `Rental: ${String(rental.vehicle_name).substring(0, 256)}`,
        metadata: {
          rental_id: String(rental.id).substring(0, 50),
          payment_id: String(payment.id).substring(0, 50),
        },
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      }
    } catch (err) {
      alert("Payment processing failed. Please try again.");
      console.error("Stripe error:", err);
    }
  };

  const createRentalMutation = useMutation({
    mutationFn: async ({ goToStripe }) => {
      const rentalData = {
        customer_id: form.customer_id,
        customer_name: String(selectedCustomer?.name || "").substring(0, 256),
        vehicle_id: form.vehicle_id,
        vehicle_name: selectedVehicle ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`.substring(0, 256) : "",
        start_date: form.start_date,
        return_date: form.return_date,
        rate_type: form.rate_type,
        base_rate: Math.max(0, pricing?.baseRate || 0),
        extras_insurance: Math.max(0, pricing?.insuranceCost || 0),
        extras_gps: Math.max(0, pricing?.gpsCost || 0),
        extras_child_seat: Math.max(0, pricing?.childSeatCost || 0),
        extras_luxury_chauffeur: Math.max(0, pricing?.chauffeurCost || 0),
        extras_total: Math.max(0, pricing?.extrasTotal || 0),
        birthday_discount: Math.max(0, pricing?.birthdayDiscount || 0),
        total_amount: Math.max(0, pricing?.total || 0),
        status: "pending_pickup",
        staff_id: form.staff_id || undefined,
        staff_name: String(selectedStaff?.name || "").substring(0, 256),
        notes: String(form.notes || "").substring(0, 1000),
      };

      // Validate before submission
      const validationError = validateRentalData(rentalData);
      if (validationError) {
        throw new Error(validationError);
      }

      const rental = await base44.entities.Rental.create(rentalData);

      const payment = await base44.entities.Payment.create({
        rental_id: rental.id,
        customer_id: form.customer_id,
        customer_name: selectedCustomer?.name || "",
        vehicle_name: rentalData.vehicle_name,
        base_rate: pricing?.baseRate || 0,
        extras_insurance: pricing?.insuranceCost || 0,
        extras_gps: pricing?.gpsCost || 0,
        extras_child_seat: pricing?.childSeatCost || 0,
        extras_luxury_chauffeur: pricing?.chauffeurCost || 0,
        extras_total: pricing?.extrasTotal || 0,
        birthday_discount: pricing?.birthdayDiscount || 0,
        total_amount: pricing?.total || 0,
        due_date: form.start_date,
        status: "pending",
      });

      await base44.entities.Vehicle.update(form.vehicle_id, { status: "rented" });

      if (selectedCustomer) {
        await base44.entities.Customer.update(form.customer_id, {
          total_rentals: (selectedCustomer.total_rentals || 0) + 1,
          total_spent: (selectedCustomer.total_spent || 0) + (pricing?.total || 0),
        });
      }

      if (selectedStaff) {
        await base44.entities.Staff.update(form.staff_id, {
          rentals_handled: (selectedStaff.rentals_handled || 0) + 1,
        });
      }

      return { rental, payment, goToStripe };
    },
    onSuccess: async ({ rental, payment, goToStripe }) => {
      queryClient.invalidateQueries();
      if (goToStripe) {
        await handleStripeCheckout(rental, payment);
      } else {
        navigate("/rentals");
      }
    },
  });

  const canSubmit = form.customer_id && form.vehicle_id && form.start_date && form.return_date && pricing;
  const isPending = createRentalMutation.isPending;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-tight">New Rental</h1>
          <p className="text-sm text-muted-foreground">Create a new rental agreement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Vehicle */}
          <Card className="p-5 space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Customer & Vehicle</h3>
            <div>
              <Label>Customer *</Label>
              <Select value={form.customer_id} onValueChange={(v) => setForm({ ...form, customer_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} — {c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle *</Label>
              <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {availableVehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} — ${v.daily_rate}/day
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableVehicles.length === 0 && (
                <p className="text-xs text-destructive mt-1">No vehicles available</p>
              )}
            </div>
          </Card>

          {/* Dates & Rate */}
          <Card className="p-5 space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Dates & Rate</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Start Date *</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
              </div>
              <div>
                <Label>Return Date *</Label>
                <Input type="date" value={form.return_date} min={form.start_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })} />
              </div>
              <div>
                <Label>Rate Type *</Label>
                <Select value={form.rate_type} onValueChange={(v) => setForm({ ...form, rate_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Extras */}
          <Card className="p-5 space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Optional Extras</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox checked={form.insurance} onCheckedChange={(v) => setForm({ ...form, insurance: v })} />
                <div>
                  <p className="text-sm font-medium">Insurance</p>
                  <p className="text-xs text-muted-foreground">${extraRates?.insurance ?? 15}/day</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox checked={form.gps} onCheckedChange={(v) => setForm({ ...form, gps: v })} />
                <div>
                  <p className="text-sm font-medium">GPS</p>
                  <p className="text-xs text-muted-foreground">${extraRates?.gps ?? 5}/day</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox checked={form.child_seat} onCheckedChange={(v) => setForm({ ...form, child_seat: v })} />
                <div>
                  <p className="text-sm font-medium">Child Seat</p>
                  <p className="text-xs text-muted-foreground">${extraRates?.childSeat ?? 8}/day</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox checked={form.chauffeur} onCheckedChange={(v) => setForm({ ...form, chauffeur: v })} />
                <div>
                  <p className="text-sm font-medium">Luxury Chauffeur</p>
                  <p className="text-xs text-muted-foreground">${extraRates?.chauffeur ?? 100}/day</p>
                </div>
              </label>
              </div>
              </Card>

          {/* Staff & Notes */}
          <Card className="p-5 space-y-4">
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground">Additional</h3>
            <div>
              <Label>Assigned Staff</Label>
              <Select value={form.staff_id} onValueChange={(v) => setForm({ ...form, staff_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select staff (optional)" /></SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} — {s.role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Any special instructions..." />
            </div>
          </Card>
        </div>

        {/* Sidebar - Price Calculator */}
        <div className="space-y-3">
          <PriceCalculator pricing={pricing} />

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2 h-12 text-base"
            disabled={!canSubmit || isPending}
            onClick={() => createRentalMutation.mutate({ goToStripe: false })}
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {isPending ? "Creating..." : "Create Rental"}
          </Button>

          <Button
            variant="outline"
            className="w-full gap-2 h-12 text-base border-2"
            disabled={!canSubmit || isPending}
            onClick={() => createRentalMutation.mutate({ goToStripe: true })}
          >
            <CreditCard className="w-5 h-5" />
            Create & Pay with Stripe
          </Button>
        </div>
      </div>
    </div>
  );
}