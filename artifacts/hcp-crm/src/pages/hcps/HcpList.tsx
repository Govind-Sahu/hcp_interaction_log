import { useState } from "react";
import { Link } from "wouter";
import { useListHcps } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, ChevronRight, Building2, MapPin } from "lucide-react";

const tierColors: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  C: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function HcpList() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useListHcps(
    { search: debouncedSearch || undefined, limit: 50 },
    { query: { queryKey: ["listHcps", debouncedSearch] } }
  );

  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((handleSearch as unknown as { _t?: ReturnType<typeof setTimeout> })._t);
    const timeout = setTimeout(() => setDebouncedSearch(value), 300);
    (handleSearch as unknown as { _t?: ReturnType<typeof setTimeout> })._t = timeout;
  };

  return (
    <div className="space-y-6" data-testid="hcp-list-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Healthcare Professionals</h1>
          <p className="text-muted-foreground mt-1">{data?.total ?? 0} HCPs in your territory</p>
        </div>
        <Link href="/interactions/log">
          <Button data-testid="btn-log-interaction">Log Interaction</Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name, specialty, or institution..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          data-testid="input-search-hcps"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-28 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data?.hcps?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No HCPs found</h3>
            <p className="text-muted-foreground text-sm text-center">
              {search ? "Try adjusting your search." : "No healthcare professionals in your territory yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.hcps.map((hcp) => (
            <Link key={hcp.id} href={`/hcps/${hcp.id}`}>
              <Card
                className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                data-testid={`card-hcp-${hcp.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">
                        Dr. {hcp.firstName} {hcp.lastName}
                      </p>
                      <p className="text-sm text-primary font-medium">{hcp.specialty}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={tierColors[hcp.tier] ?? ""} variant="secondary">
                        Tier {hcp.tier}
                      </Badge>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="size-3.5 shrink-0" />
                      <span className="truncate">{hcp.institution}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-3.5 shrink-0" />
                      <span>{hcp.territory}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <span>{hcp.totalInteractions} interaction{hcp.totalInteractions !== 1 ? "s" : ""}</span>
                    {hcp.lastInteractionDate && (
                      <span>Last: {new Date(hcp.lastInteractionDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
