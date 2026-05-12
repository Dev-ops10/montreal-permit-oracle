import React, { useState } from "react";
import { useListBoroughs, useGetLargePermits } from "@workspace/api-client-react";
import { PermitCard } from "@/components/permit-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function LargeProjects() {
  const [borough, setBorough] = useState<string>("all");
  const [minUnits, setMinUnits] = useState<string>("20");

  const { data: boroughsData } = useListBoroughs({ query: { queryKey: ["/api/permits/boroughs"] } });
  
  const queryParams = { 
    borough: borough === "all" ? undefined : borough, 
    min_units: parseInt(minUnits, 10), 
    limit: 50 
  };
  
  const { data: permitsData, isLoading } = useGetLargePermits(queryParams, {
    query: {
      enabled: true,
      queryKey: ["/api/permits/large", queryParams]
    }
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 flex flex-col h-full">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Large Scale Projects</h1>
        <p className="text-muted-foreground mb-6">Track major residential developments across the city sorted by unit count.</p>
        
        <div className="flex flex-wrap items-end gap-6 bg-muted/30 p-4 rounded-lg border border-border">
          <div className="space-y-2 w-full sm:w-72">
            <Label>Borough Filter</Label>
            <Select value={borough} onValueChange={setBorough}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="All Boroughs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Boroughs</SelectItem>
                {boroughsData?.boroughs.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 w-full sm:w-48">
            <Label>Minimum Units</Label>
            <Select value={minUnits} onValueChange={setMinUnits}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="20+ Units" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10+ Units</SelectItem>
                <SelectItem value="20">20+ Units</SelectItem>
                <SelectItem value="50">50+ Units</SelectItem>
                <SelectItem value="100">100+ Units</SelectItem>
                <SelectItem value="200">200+ Units</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto pr-2 pb-8">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-md animate-pulse border border-border"></div>
            ))}
          </div>
        ) : permitsData?.permits.length === 0 ? (
          <div className="text-center p-12 bg-muted/20 border border-dashed border-border rounded-lg">
            <p className="text-lg font-medium">No large projects found</p>
            <p className="text-muted-foreground mt-1">Try lowering the minimum unit count.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Showing {permitsData?.returned} largest projects (max 50)
            </div>
            {permitsData?.permits.map(permit => (
              <PermitCard key={permit.id} permit={permit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
