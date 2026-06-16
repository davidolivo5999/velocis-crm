import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { differenceInDays } from "date-fns";

export const DEFAULT_RATES = {
  insurance: 15,
  gps: 5,
  childSeat: 8,
};

const isBirthday = (birthDate) => {
  if (!birthDate) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  return today.getMonth() === birth.getMonth() && today.getDate() === birth.getDate();
};

export function calculatePrice({ vehicle, rateType, startDate, returnDate, insurance, gps, childSeat, chauffeur, extraRates, customerBirthDate, birthdayDiscountPercent }) {
  if (!vehicle || !startDate || !returnDate) return null;

  const rates = { ...DEFAULT_RATES, ...extraRates };

  const start = new Date(startDate);
  const end = new Date(returnDate);
  const days = Math.max(differenceInDays(end, start), 1);

  let baseRate = 0;
  let units = 0;
  let unitLabel = "";

  if (rateType === "daily") {
    baseRate = (vehicle.daily_rate || 0) * days;
    units = days;
    unitLabel = days === 1 ? "day" : "days";
  } else if (rateType === "weekly") {
    const weeks = Math.max(Math.ceil(days / 7), 1);
    baseRate = (vehicle.weekly_rate || vehicle.daily_rate * 7) * weeks;
    units = weeks;
    unitLabel = weeks === 1 ? "week" : "weeks";
  } else if (rateType === "monthly") {
    const months = Math.max(Math.ceil(days / 30), 1);
    baseRate = (vehicle.monthly_rate || vehicle.daily_rate * 30) * months;
    units = months;
    unitLabel = months === 1 ? "month" : "months";
  }

  const insuranceCost = insurance ? days * rates.insurance : 0;
  const gpsCost = gps ? days * rates.gps : 0;
  const childSeatCost = childSeat ? days * rates.childSeat : 0;
  const chauffeurCost = chauffeur ? days * (rates.chauffeur || 100) : 0;
  const extrasTotal = insuranceCost + gpsCost + childSeatCost + chauffeurCost;
  const subtotal = baseRate + extrasTotal;
  const hasBirthdayDiscount = isBirthday(customerBirthDate);
  const discountPercent = birthdayDiscountPercent || 10;
  const birthdayDiscount = hasBirthdayDiscount ? Math.round(subtotal * (discountPercent / 100) * 100) / 100 : 0;
  const total = subtotal - birthdayDiscount;

  return {
    baseRate: Math.round(baseRate * 100) / 100,
    units,
    unitLabel,
    days,
    insuranceCost: Math.round(insuranceCost * 100) / 100,
    gpsCost: Math.round(gpsCost * 100) / 100,
    childSeatCost: Math.round(childSeatCost * 100) / 100,
    chauffeurCost: Math.round(chauffeurCost * 100) / 100,
    extrasTotal: Math.round(extrasTotal * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    birthdayDiscount,
    hasBirthdayDiscount,
    total: Math.round(total * 100) / 100,
    rates,
  };
}

export default function PriceCalculator({ pricing }) {
  if (!pricing) {
    return (
      <Card className="p-5 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center">
          Select a vehicle and dates to see pricing
        </p>
      </Card>
    );
  }

  const r = pricing.rates || DEFAULT_RATES;

  return (
    <Card className="p-5 bg-primary text-primary-foreground">
      <h3 className="font-heading font-semibold text-sm mb-4 uppercase tracking-wider opacity-70">Price Breakdown</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="opacity-80">Base rate ({pricing.units} {pricing.unitLabel})</span>
          <span className="font-medium">${pricing.baseRate.toLocaleString()}</span>
        </div>
        {pricing.insuranceCost > 0 && (
          <div className="flex justify-between">
            <span className="opacity-80">Insurance ({pricing.days}d × ${r.insurance})</span>
            <span>${pricing.insuranceCost}</span>
          </div>
        )}
        {pricing.gpsCost > 0 && (
          <div className="flex justify-between">
            <span className="opacity-80">GPS ({pricing.days}d × ${r.gps})</span>
            <span>${pricing.gpsCost}</span>
          </div>
        )}
        {pricing.childSeatCost > 0 && (
          <div className="flex justify-between">
            <span className="opacity-80">Child Seat ({pricing.days}d × ${r.childSeat})</span>
            <span>${pricing.childSeatCost}</span>
          </div>
        )}
        {pricing.chauffeurCost > 0 && (
          <div className="flex justify-between">
            <span className="opacity-80">Luxury Chauffeur ({pricing.days}d × ${r.chauffeur})</span>
            <span>${pricing.chauffeurCost}</span>
          </div>
        )}
        <Separator className="bg-primary-foreground/20" />
        {pricing.hasBirthdayDiscount && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between opacity-80">
              <span>Subtotal</span>
              <span>${pricing.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-green-300 font-medium">
              <span>Birthday Discount (10%)</span>
              <span>-${pricing.birthdayDiscount.toLocaleString()}</span>
            </div>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>${pricing.total.toLocaleString()}</span>
        </div>
      </div>
    </Card>
  );
}