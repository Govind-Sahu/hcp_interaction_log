import { Link, useParams, useLocation } from "wouter";
import { useGetHcp, getGetHcpQueryKey, useGetHcpInteractions, getGetHcpInteractionsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, MapPin, Phone, Mail, ArrowLeft, PlusCircle, Clock } from "lucide-react";

const tierColors: Record<string, string> = {
  A: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  C: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const sentimentBadge: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const typeLabel: Record<string, string> = {
  visit: "Office Visit",
  call: "Phone Call",
  email: "Email",
  virtual_meeting: "Virtual Meeting",
  conference: "Conference",
  other: "Other",
};

export function HcpDetail() {
  const { id } = useParams<{ id: string }>();
  const hcpId = Number(id);
  const [, navigate] = useLocation();

  const { data: hcp, isLoading: hcpLoading } = useGetHcp(hcpId, {
    query: { enabled: !!hcpId, queryKey: getGetHcpQueryKey(hcpId) },
  });

  const { data: interactionsData, isLoading: interactionsLoading } = useGetHcpInteractions(hcpId, {
    query: { enabled: !!hcpId, queryKey: getGetHcpInteractionsQueryKey(hcpId) },
  });

  if (hcpLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card><CardContent className="p-6"><Skeleton className="h-40 w-full" /></CardContent></Card>
      </div>
    );
  }

  if (!hcp) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">HCP not found.</p>
        <Link href="/hcps"><Button variant="outline" className="mt-4">Back to HCPs</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="hcp-detail-page">
      <div className="flex items-center gap-4">
        <Link href="/hcps">
          <Button variant="ghost" size="icon" data-testid="btn-back-hcps">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Dr. {hcp.firstName} {hcp.lastName}
          </h1>
          <p className="text-primary font-medium">{hcp.specialty}</p>
        </div>
        <Link href={`/interactions/log?hcpId=${hcpId}`}>
          <Button data-testid="btn-log-interaction-for-hcp">
            <PlusCircle className="size-4 mr-2" />
            Log Interaction
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Building2 className="size-4 text-muted-foreground shrink-0" />
              <span>{hcp.institution}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              <span>{hcp.territory}</span>
            </div>
            {hcp.phone && (
              <div className="flex items-center gap-3">
                <Phone className="size-4 text-muted-foreground shrink-0" />
                <span>{hcp.phone}</span>
              </div>
            )}
            {hcp.email && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <span>{hcp.email}</span>
              </div>
            )}
            {hcp.npi && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-xs font-mono">NPI</span>
                <span className="font-mono text-sm">{hcp.npi}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{hcp.totalInteractions}</p>
                <p className="text-sm text-muted-foreground">Total Interactions</p>
              </div>
              <Badge className={tierColors[hcp.tier] ?? ""} variant="secondary">
                Tier {hcp.tier}
              </Badge>
            </CardContent>
          </Card>
          {hcp.lastInteractionDate && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="size-4" />
                  <span className="text-xs font-medium uppercase tracking-wider">Last Contact</span>
                </div>
                <p className="font-medium">{new Date(hcp.lastInteractionDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {interactionsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !interactionsData?.interactions?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No interactions logged yet.</p>
              <Link href={`/interactions/log?hcpId=${hcpId}`}>
                <Button variant="outline" size="sm" className="mt-3">Log First Interaction</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {interactionsData.interactions.map((interaction) => (
                <Link key={interaction.id} href={`/interactions/${interaction.id}`}>
                  <div
                    className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    data-testid={`interaction-row-${interaction.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{typeLabel[interaction.type] ?? interaction.type}</span>
                        {interaction.sentiment && (
                          <Badge className={sentimentBadge[interaction.sentiment] ?? ""} variant="secondary">
                            {interaction.sentiment}
                          </Badge>
                        )}
                        {interaction.followUpRequired && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">Follow-up</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {interaction.aiSummary ?? interaction.notes}
                      </p>
                      {interaction.productsDiscussed?.length > 0 && (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          {interaction.productsDiscussed.map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground text-right shrink-0">
                      <p>{new Date(interaction.date).toLocaleDateString()}</p>
                      {interaction.duration && <p>{interaction.duration} min</p>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
