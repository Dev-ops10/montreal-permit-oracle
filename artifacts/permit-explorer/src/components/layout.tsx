import React from "react";
import { Link, useLocation } from "wouter";
import { Activity, LayoutDashboard, Clock, Building2, Search } from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarProvider } from "@/components/ui/sidebar";
import { useGetDataStatus, useHealthCheck } from "@workspace/api-client-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { data: status } = useGetDataStatus({ query: { queryKey: ["/api/permits/data-status"] } });
  const { data: health } = useHealthCheck({ query: { queryKey: ["/api/healthz"] } });

  const isLoaded = status?.loaded ?? false;
  const isHealthy = health?.status === "ok";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground w-64 shrink-0 flex flex-col">
          <SidebarHeader className="p-4 border-b border-sidebar-border">
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">MTL Permits</span>
            </div>
            <div className="text-xs text-sidebar-muted-foreground font-mono">
              CIVIC DATA EXPLORER
            </div>
          </SidebarHeader>
          
          <SidebarContent className="flex-1 p-3">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Overview
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/recent"}>
                  <Link href="/recent">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Permits
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/large"}>
                  <Link href="/large">
                    <Activity className="w-4 h-4 mr-2" />
                    Large Projects
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/search"}>
                  <Link href="/search">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <div className="p-4 border-t border-sidebar-border text-xs space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${isLoaded ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="font-mono">{isLoaded ? 'DATA LOADED' : 'LOADING DATA...'}</span>
            </div>
            {status?.total_rows && (
              <div className="text-sidebar-muted-foreground opacity-60">
                {status.total_rows.toLocaleString()} records
              </div>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-sidebar-border/50">
              <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-mono text-muted-foreground">API: {isHealthy ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>
        </Sidebar>

        <main className="flex-1 overflow-auto bg-background">
          {!isLoaded ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
              <h2 className="text-xl font-semibold mb-2">Loading permit data from Montreal Open Data...</h2>
              <p className="text-muted-foreground max-w-md">
                Downloading ~79MB of civic data. This will take a moment on the first run.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
