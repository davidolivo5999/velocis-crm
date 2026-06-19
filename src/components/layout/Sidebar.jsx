import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Car,
  Users,
  CarFront,
  CreditCard,
  Wrench,
  UserCog,
  PlusCircle,
  Menu,
  X,
  ChevronRight,
  Settings,
  Fuel,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Rentals", icon: Car, path: "/rentals" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Fleet", icon: CarFront, path: "/fleet" },
  { label: "Payments", icon: CreditCard, path: "/payments" },
  { label: "Maintenance", icon: Wrench, path: "/maintenance" },
  { label: "Staff", icon: UserCog, path: "/staff" },
  { label: "Gas Alerts", icon: Fuel, path: "/gas-alerts" },
  { label: "New Rental", icon: PlusCircle, path: "/new-rental" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="https://media.base44.com/images/public/6a2fe875358d60a34ee442ab/14fa00edc_Untitleddesign-3.png" alt="On Tour Rental" className="h-8 w-auto object-contain" />
        </div>
        <button onClick={() => setOpen(!open)} className="text-sidebar-foreground p-1">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <img src="https://media.base44.com/images/public/6a2fe875358d60a34ee442ab/14fa00edc_Untitleddesign-3.png" alt="On Tour Rental" className="h-12 w-auto object-contain" />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-sidebar-primary")} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 text-sidebar-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-sidebar-accent/50 rounded-xl p-3">
            <p className="text-xs text-sidebar-foreground/50 mb-1">Active Fleet</p>
            <p className="text-sm font-semibold text-sidebar-foreground">On Tour Rental</p>
          </div>
        </div>
      </aside>
    </>
  );
}