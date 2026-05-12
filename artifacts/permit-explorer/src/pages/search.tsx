import React, { useState } from "react";
import { useListBoroughs, useSearchPermits } from "@workspace/api-client-react";
import { PermitCard } from "@/components/permit-card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search as SearchIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Search() {
  const [query, setQuery] = useState("");
  const [borough, setBorough] = useState<string>("all");
  
  const debouncedQuery = useDebounce(query, 400);

  const { data: boroughsData } = useListBoroughs({ query: { queryKey: ["/api/permits/boroughs"] } });
  
  const queryParams = { 
    q: debouncedQuery, 
    borough: borough === "all" ? undefined : borough, 
    limit: 50 
  };
  
  const { data: permitsData, isLoading } = useSearchPermits(queryParams, {
    query: {
      enabled: debouncedQuery.length >= 3,
      queryKey: ["/api/permits/search", queryParams]
    }
  });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 flex flex-col h-full">
      <div className="border-b border-border pb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Database Search</h1>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search by street name, address, or description..." 
              className="pl-10 h-12 text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64">
            <Select value={borough} onValueChange={setBorough}>
              <SelectTrigger className="h-12">
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
        </div>
        {query.length > 0 && query.length < 3 && (
          <p className="text-sm text-yellow-600 mt-3 font-medium">Please enter at least 3 characters to search.</p>
        )}
      </div>

      <div className="flex-1 overflow-auto pr-2 pb-8">
        {isLoading && debouncedQuery.length >= 3 ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded-md animate-pulse border border-border"></div>
            ))}
          </div>
        ) : !debouncedQuery || debouncedQuery.length < 3 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-60">
            <SearchIcon className="w-16 h-16 mb-4" />
            <p className="text-lg">Start typing to search ~550k permits</p>
          </div>
        ) : permitsData?.permits.length === 0 ? (
          <div className="text-center p-12 bg-muted/20 border border-dashed border-border rounded-lg">
            <p className="text-lg font-medium">No results found for "{debouncedQuery}"</p>
            <p className="text-muted-foreground mt-1">Try a different keyword or removing the borough filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              Found {permitsData?.total} results. Showing top {permitsData?.returned}.
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
