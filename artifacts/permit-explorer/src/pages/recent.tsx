import React, { useState } from "react";
import { useListBoroughs, useGetRecentPermits } from "@workspace/api-client-react";
import { PermitCard } from "@/components/permit-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function Recent() {
  const [borough, setBorough] = useState<string>("");
  const [days, setDays] = useState<string>("30");

  const { data: boroughsData } = useListBoroughs({ query: { queryKey: ["/api/permits/boroughs"] } });
  
  const queryParams = { borough: borough || "Ville-Marie", days: parseInt(days, 10), limit: 100 };
  const { data: permitsData, isLoading } = useGetRecentPermits(queryParams, {
    query: {
      enabled: true,
      queryKey: ["/api/permits/recent", queryParams]
    }
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 flex flex-col h-full">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4">Recent Activity</h1>
        <div className="flex flex-wrap items-end gap-6 bg-muted/30 p-4 rounded-lg border border-border">
          <div className="space-y-2 w-full sm:w-72">
            <Label>Borough</Label>
            <Select value={borough} onValueChange={setBorough}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select borough" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ville-Marie">Ville-Marie (Default)</SelectItem>
                {boroughsData?.boroughs.filter(b => b !== "Ville-Marie").map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2 w-full sm:w-48">
            <Label>Timeframe</Label>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Last 30 days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="14">Last 14 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last 365 days</SelectItem>
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
            <p className="text-lg font-medium">No permits found</p>
            <p className="text-muted-foreground mt-1">Try expanding your timeframe or selecting another borough.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Showing {permitsData?.returned} recent permits (max 100)
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
