import React from "react";
import type { Permit } from "@workspace/api-client-react";
import { MapPin, Briefcase, Building, Calendar, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function PermitCard({ permit }: { permit: Permit }) {
  return (
    <div className="bg-card border border-border p-5 rounded-md shadow-sm flex flex-col gap-4 group hover:border-primary/50 transition-colors">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-start gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="leading-tight">{permit.address}</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1 ml-7">
            {permit.borough}
          </p>
        </div>
        {permit.units && permit.units > 0 && (
          <div className="bg-primary/10 text-primary px-3 py-1.5 rounded text-sm font-bold flex flex-col items-center justify-center shrink-0 border border-primary/20">
            <span className="text-xs uppercase tracking-wider opacity-80 mb-0.5">Units</span>
            <span className="text-lg leading-none">{permit.units}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 ml-7 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="w-4 h-4 opacity-70" />
          <span className="font-medium text-foreground">{permit.work_type}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building className="w-4 h-4 opacity-70" />
          <span className="truncate" title={permit.building_type}>{permit.building_type || "Unknown type"}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 opacity-70" />
          <span>Issued: {permit.date_issued}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Hash className="w-4 h-4 opacity-70" />
          <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">{permit.id}</span>
        </div>
      </div>

      {permit.work_detail && (
        <div className="ml-7 mt-2 p-3 bg-muted/50 rounded-sm text-sm border-l-2 border-border italic text-muted-foreground">
          {permit.work_detail}
        </div>
      )}
    </div>
  );
}
