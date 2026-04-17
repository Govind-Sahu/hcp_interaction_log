import { useParams, useLocation } from "wouter";
import { useGetInteraction, getGetInteractionQueryKey, useUpdateInteraction } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

const PRODUCTS = ["Nexavar", "Afinitor", "Jardiance", "Farxiga", "Keytruda", "Opdivo", "Humira", "Enbrel", "Xarelto", "Eliquis"];

export function EditInteraction() {
  const { id } = useParams<{ id: string }>();
  const interactionId = Number(id);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const { data: interaction, isLoading } = useGetInteraction(interactionId, {
    query: { enabled: !!interactionId, queryKey: getGetInteractionQueryKey(interactionId) },
  });

  const form = useForm({
    defaultValues: {
      type: "visit" as const,
      date: "",
      duration: "",
      notes: "",
      followUpRequired: false,
      followUpNotes: "",
    },
  });

  useEffect(() => {
    if (interaction) {
      form.reset({
        type: interaction.type as "visit" | "call" | "email" | "virtual_meeting" | "conference" | "other",
        date: new Date(interaction.date).toISOString().split("T")[0],
        duration: interaction.duration ? String(interaction.duration) : "",
        notes: interaction.notes,
        followUpRequired: interaction.followUpRequired,
        followUpNotes: interaction.followUpNotes ?? "",
      });
      setSelectedProducts(interaction.productsDiscussed ?? []);
    }
  }, [interaction]);

  const updateMutation = useUpdateInteraction();

  const onSubmit = form.handleSubmit((values) => {
    updateMutation.mutate(
      {
        id: interactionId,
        data: {
          type: values.type,
          date: new Date(`${values.date}T12:00:00`).toISOString(),
          duration: values.duration ? Number(values.duration) : undefined,
          notes: values.notes,
          productsDiscussed: selectedProducts,
          followUpRequired: values.followUpRequired,
          followUpNotes: values.followUpNotes || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetInteractionQueryKey(interactionId) });
          toast({ title: "Interaction updated" });
          navigate(`/interactions/${interactionId}`);
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      }
    );
  });

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (!interaction) return <div className="text-center py-12 text-muted-foreground">Interaction not found.</div>;

  const toggleProduct = (p: string) => {
    setSelectedProducts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="edit-interaction-page">
      <div className="flex items-center gap-4">
        <Link href={`/interactions/${interactionId}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Interaction</h1>
          <p className="text-muted-foreground text-sm">with Dr. {interaction.hcpName}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interaction Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="visit">Office Visit</SelectItem>
                        <SelectItem value="call">Phone Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="virtual_meeting">Virtual Meeting</SelectItem>
                        <SelectItem value="conference">Conference</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} data-testid="input-date" /></FormControl>
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="duration" render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl><Input type="number" {...field} data-testid="input-duration" /></FormControl>
                </FormItem>
              )} />

              <div>
                <Label className="mb-2 block">Products Discussed</Label>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTS.map((p) => (
                    <Badge key={p} variant={selectedProducts.includes(p) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleProduct(p)}>
                      {p}
                    </Badge>
                  ))}
                </div>
              </div>

              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[120px]" {...field} data-testid="textarea-notes" />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="followUpRequired" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-follow-up" /></FormControl>
                  <FormLabel className="!mt-0">Follow-up required</FormLabel>
                </FormItem>
              )} />

              {form.watch("followUpRequired") && (
                <FormField control={form.control} name="followUpNotes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up Notes</FormLabel>
                    <FormControl><Input {...field} data-testid="input-follow-up-notes" /></FormControl>
                  </FormItem>
                )} />
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={updateMutation.isPending} className="flex-1" data-testid="btn-save">
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
                <Link href={`/interactions/${interactionId}`}>
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
