import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Fuel, Plus, Check } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";

export default function GasAlerts() {
  const [open, setOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [gasLevel, setGasLevel] = useState("");
  const [location, setLocation] = useState("");
  const [checkType, setCheckType] = useState("pickup");
  const [usingGPS, setUsingGPS] = useState(false);
  const [coords, setCoords] = useState(null);
  const queryClient = useQueryClient();

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => base44.entities.Vehicle.list("make", 500),
  });

  const { data: gasChecks = [] } = useQuery({
    queryKey: ["gasChecks"],
    queryFn: () => base44.entities.GasLevelCheck.list("-check_date", 100),
  });

  const createCheckMutation = useMutation({
    mutationFn: async () => {
      const level = Number(gasLevel);
      const vehicle = vehicles.find(v => v.id === selectedVehicle);
      
      let status = "normal";
      if (level <= 10) status = "critical";
      else if (level <= 25) status = "low";
      else if (level >= 90) status = "full";

      await base44.entities.GasLevelCheck.create({
        vehicle_id: selectedVehicle,
        vehicle_name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        gas_level_percent: level,
        check_type: checkType,
        location,
        latitude: coords?.lat || null,
        longitude: coords?.lng || null,
        check_date: new Date().toISOString(),
        status,
      });

      queryClient.invalidateQueries({ queryKey: ["gasChecks"] });
      setSelectedVehicle("");
      setGasLevel("");
      setLocation("");
      setCheckType("pickup");
      setCoords(null);
      setUsingGPS(false);
      setOpen(false);
    },
  });

  const getGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
          setUsingGPS(true);
        },
        () => alert("Unable to get location. Please enter manually.")
      );
    }
  };

  const statusConfig = {
    critical: { color: "bg-destructive text-destructive-foreground", label: "Critical" },
    low: { color: "bg-orange-100 text-orange-900", label: "Low" },
    normal: { color: "bg-blue-100 text-blue-900", label: "Normal" },
    full: { color: "bg-green-100 text-green-900", label: "Full" },
  };

  const criticalAlerts = gasChecks.filter(c => c.status === "critical");
  const lowAlerts = gasChecks.filter(c => c.status === "low");
  const recentChecks = gasChecks.slice(0, 15);

  return (
    <div>
      <PageHeader
        title="Gas Level Alerts"
        subtitle="Track vehicle fuel levels and locations at pickup & dropoff"
        action={() => setOpen(true)}
        actionLabel="Log Gas Check"
        actionIcon={Plus}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Critical Alerts</p>
                <p className="text-3xl font-bold text-destructive">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Low Gas Warnings</p>
                <p className="text-3xl font-bold text-orange-600">{lowAlerts.length}</p>
              </div>
              <Fuel className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Checks</p>
                <p className="text-3xl font-bold">{gasChecks.length}</p>
              </div>
              <Check className="w-8 h-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Gas Level Checks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentChecks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No gas checks logged yet</p>
            ) : (
              recentChecks.map((check) => {
                const config = statusConfig[check.status];
                return (
                  <div key={check.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                          {check.gas_level_percent}%
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{check.vehicle_name}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {check.check_type} • {new Date(check.check_date).toLocaleDateString()} {new Date(check.check_date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{config.label}</Badge>
                    </div>
                    {check.location && (
                      <div className="mt-2 pl-3 border-l-2 border-accent">
                        <p className="text-xs text-muted-foreground">
                          📍 {check.location}
                          {check.latitude && check.longitude && (
                            <span className="ml-2">({check.latitude.toFixed(4)}, {check.longitude.toFixed(4)})</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Gas Level Check</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Check Type *</Label>
              <Select value={checkType} onValueChange={setCheckType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="dropoff">Dropoff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Vehicle *</Label>
              <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.year} {v.make} {v.model} — {v.license_plate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gas Level (%) *</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={gasLevel}
                onChange={(e) => setGasLevel(e.target.value)}
                placeholder="0-100"
              />
            </div>
            <div>
              <Label>Location *</Label>
              <div className="flex gap-2">
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter address or location"
                />
                <Button variant="outline" onClick={getGPS} className="shrink-0">
                  📍 GPS
                </Button>
              </div>
              {usingGPS && coords && (
                <p className="text-xs text-muted-foreground mt-1">GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</p>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => createCheckMutation.mutate()}
                disabled={!selectedVehicle || !gasLevel || !location || createCheckMutation.isPending}
              >
                {createCheckMutation.isPending ? "Saving..." : "Log Check"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}