import React from "react";
import { Button } from "@/components/ui/button";

export default function PageHeader({ title, subtitle, action, actionLabel, actionIcon: ActionIcon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-heading font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
      {action && (
        <Button onClick={action} className="bg-accent text-accent-foreground hover:bg-accent/90 gap-2 shrink-0">
          {ActionIcon && <ActionIcon className="w-4 h-4" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );
}