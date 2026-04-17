import { useState } from "react";
import { Link } from "wouter";
import { useListInteractions, getListInteractionsQueryKey, useDeleteInteraction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Pencil, Trash2, Activity } from "lucide-react";

const typeLabel: Record<string, string> = {
  visit: "Office Visit",
  call: "Phone Call",
  email: "Email",
  virtual_meeting: "Virtual Meeting",
  conference: "Conference",
  other: "Other",
};

const sentimentBadge: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function InteractionList() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading } = useListInteractions(
    { type: typeFilter || undefined, limit: 50 },
    { query: { queryKey: getListInteractionsQueryKey({ type: typeFilter || undefined, limit: 50 }) } }
  );

  const deleteMutation = useDeleteInteraction({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListInteractionsQueryKey({}) });
        toast({ title: "Interaction deleted" });
      },
    },
  });

  return (
    <div className="space-y-6" data-testid="interaction-list-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Interactions</h1>
          <p className="text-muted-foreground mt-1">{data?.total ?? 0} total interactions</p>
        </div>
        <Link href="/interactions/log">
          <Button data-testid="btn-log-new-interaction">
            <PlusCircle className="size-4 mr-2" />
            Log Interaction
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-type-filter">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            <SelectItem value="visit">Office Visit</SelectItem>
            <SelectItem value="call">Phone Call</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="virtual_meeting">Virtual Meeting</SelectItem>
            <SelectItem value="conference">Conference</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : !data?.interactions?.length ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="size-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No interactions found</h3>
            <Link href="/interactions/log">
              <Button variant="outline" size="sm">Log your first interaction</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.interactions.map((interaction) => (
            <Card key={interaction.id} className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/hcps/${interaction.hcpId}`}>
                        <span className="font-semibold hover:text-primary cursor-pointer" data-testid={`text-hcp-name-${interaction.id}`}>
                          Dr. {interaction.hcpName}
                        </span>
                      </Link>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-sm">{typeLabel[interaction.type] ?? interaction.type}</span>
                      {interaction.sentiment && (
                        <Badge className={sentimentBadge[interaction.sentiment] ?? ""} variant="secondary">
                          {interaction.sentiment}
                        </Badge>
                      )}
                      {interaction.followUpRequired && (
                        <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">Follow-up</Badge>
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
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <p className="text-xs text-muted-foreground">
                      {new Date(interaction.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {interaction.duration && (
                      <p className="text-xs text-muted-foreground">{interaction.duration} min</p>
                    )}
                    <div className="flex gap-1.5">
                      <Link href={`/interactions/${interaction.id}/edit`}>
                        <Button variant="ghost" size="icon" className="size-7" data-testid={`btn-edit-interaction-${interaction.id}`}>
                          <Pencil className="size-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        data-testid={`btn-delete-interaction-${interaction.id}`}
                        onClick={() => deleteMutation.mutate({ id: interaction.id })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
