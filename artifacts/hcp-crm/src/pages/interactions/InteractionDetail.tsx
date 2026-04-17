import { Link, useParams } from "wouter";
import { useGetInteraction, getGetInteractionQueryKey, useDeleteInteraction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil, Trash2, CalendarCheck2, Clock, CheckCircle2 } from "lucide-react";

const typeLabel: Record<string, string> = {
  visit: "Office Visit", call: "Phone Call", email: "Email",
  virtual_meeting: "Virtual Meeting", conference: "Conference", other: "Other",
};

const sentimentBadge: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  negative: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function InteractionDetail() {
  const { id } = useParams<{ id: string }>();
  const interactionId = Number(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: interaction, isLoading } = useGetInteraction(interactionId, {
    query: { enabled: !!interactionId, queryKey: getGetInteractionQueryKey(interactionId) },
  });

  const deleteMutation = useDeleteInteraction({
    mutation: {
      onSuccess: () => { toast({ title: "Interaction deleted" }); navigate("/interactions"); },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    },
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!interaction) return <div className="text-center py-12 text-muted-foreground">Interaction not found.</div>;

  return (
    <div className="space-y-6 max-w-2xl" data-testid="interaction-detail-page">
      <div className="flex items-center gap-4">
        <Link href="/interactions">
          <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Interaction with Dr. {interaction.hcpName}</h1>
          <p className="text-muted-foreground text-sm">{typeLabel[interaction.type]} · {new Date(interaction.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/interactions/${interactionId}/edit`}>
            <Button variant="outline" size="sm" data-testid="btn-edit"><Pencil className="size-3.5 mr-1.5" />Edit</Button>
          </Link>
          <Button variant="destructive" size="sm" data-testid="btn-delete" onClick={() => deleteMutation.mutate({ id: interactionId })}>
            <Trash2 className="size-3.5 mr-1.5" />Delete
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {interaction.sentiment && <Badge className={sentimentBadge[interaction.sentiment] ?? ""}>{interaction.sentiment}</Badge>}
        {interaction.duration && <Badge variant="outline"><Clock className="size-3 mr-1" />{interaction.duration} min</Badge>}
        {interaction.followUpRequired && <Badge variant="outline" className="text-amber-600 border-amber-300"><CalendarCheck2 className="size-3 mr-1" />Follow-up Required</Badge>}
      </div>

      {interaction.aiSummary && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" />AI Summary</CardTitle></CardHeader>
          <CardContent><p className="text-sm" data-testid="text-ai-summary">{interaction.aiSummary}</p></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Interaction Notes</CardTitle></CardHeader>
        <CardContent><p className="text-sm whitespace-pre-wrap" data-testid="text-notes">{interaction.notes}</p></CardContent>
      </Card>

      {interaction.productsDiscussed?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Products Discussed</CardTitle></CardHeader>
          <CardContent className="flex gap-2 flex-wrap">
            {interaction.productsDiscussed.map((p) => <Badge key={p} variant="secondary">{p}</Badge>)}
          </CardContent>
        </Card>
      )}

      {interaction.followUpRequired && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader><CardTitle className="text-sm text-amber-700 dark:text-amber-300">Follow-up</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {interaction.followUpDate && <p className="text-sm"><span className="font-medium">Due:</span> {new Date(interaction.followUpDate).toLocaleDateString()}</p>}
            {interaction.followUpNotes && <p className="text-sm" data-testid="text-follow-up-notes">{interaction.followUpNotes}</p>}
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground pt-2 border-t">
        <Link href={`/hcps/${interaction.hcpId}`}>
          <span className="hover:text-primary cursor-pointer">View Dr. {interaction.hcpName}'s full profile</span>
        </Link>
        <span className="mx-2">·</span>
        <span>Logged {new Date(interaction.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
