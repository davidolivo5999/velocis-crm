import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings, CheckCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settingsList = [], isLoading } = useQuery({
    queryKey: ["rentalSettings"],
    queryFn: () => base44.entities.RentalSettings.list(),
  });

  const settings = settingsList[0];

  const [form, setForm] = useState({
    insurance_daily_rate: 15,
    gps_daily_rate: 5,
    child_seat_daily_rate: 8,
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        insurance_daily_rate: settings.insurance_daily_rate ?? 15,
        gps_daily_rate: settings.gps_daily_rate ?? 5,
        child_seat_daily_rate: settings.child_seat_daily_rate ?? 8,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const parsed = {
        insurance_daily_rate: Number(data.insurance_daily_rate),
        gps_daily_rate: Number(data.gps_daily_rate),
        child_seat_daily_rate: Number(data.child_seat_daily_rate),
      };
      if (settings) {
        return base44.entities.RentalSettings.update(settings.id, parsed);
      } else {
        return base44.entities.RentalSettings.create(parsed);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentalSettings"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-muted border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Settings" subtitle="Configure pricing and app preferences" />

      <div className="max-w-lg space-y-6">
        <Card className="p-6 space-y-5">
          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
              Add-on Daily Rates
            </h3>
            <div className="space-y-4">
              <div>
                <Label>Insurance ($/day)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.insurance_daily_rate}
                  onChange={(e) => setForm({ ...form, insurance_daily_rate: e.target.value })}
                />
              </div>
              <div>
                <Label>GPS ($/day)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.gps_daily_rate}
                  onChange={(e) => setForm({ ...form, gps_daily_rate: e.target.value })}
                />
              </div>
              <div>
                <Label>Child Seat ($/day)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.child_seat_daily_rate}
                  onChange={(e) => setForm({ ...form, child_seat_daily_rate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
            onClick={() => saveMutation.mutate(form)}
            disabled={saveMutation.isPending}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : saveMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </Card>
      </div>
    </div>
  );
}