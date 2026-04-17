import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { addChatMessage, clearChatHistory } from "@/store/slices/interactionSlice";
import {
  useListHcps,
  useCreateInteraction,
  getListInteractionsQueryKey,
  useRunAiChat,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Send, Bot, User, CheckCircle2, ArrowLeft, Mic, Plus, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const PRODUCTS = ["Nexavar", "Afinitor", "Jardiance", "Farxiga", "Keytruda", "Opdivo", "Humira", "Enbrel", "Xarelto", "Eliquis"];

export function LogInteraction() {
  const dispatch = useDispatch();
  const chatHistory = useSelector((state: RootState) => state.interaction.chatHistory);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const defaultHcpId = params.get("hcpId") ? Number(params.get("hcpId")) : undefined;

  const [chatInput, setChatInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [attendees, setAttendees] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState("");
  const [chatReadyToLog, setChatReadyToLog] = useState(false);
  const [hcpSearch, setHcpSearch] = useState("");
  const [showHcpDropdown, setShowHcpDropdown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hcpRef = useRef<HTMLDivElement>(null);

  const { data: hcpsData } = useListHcps({ search: hcpSearch || undefined, limit: 20 }, { query: { queryKey: ["listHcps", hcpSearch] } });
  const createInteraction = useCreateInteraction();
  const runChat = useRunAiChat();

  const form = useForm({
    defaultValues: {
      hcpId: defaultHcpId ?? 0,
      hcpName: "",
      type: "visit" as const,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toTimeString().slice(0, 5),
      duration: "",
      notes: "",
      followUpRequired: false,
      followUpNotes: "",
    },
  });

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatHistory]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (hcpRef.current && !hcpRef.current.contains(e.target as Node)) {
        setShowHcpDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleFormSubmit = form.handleSubmit((values) => {
    if (!values.hcpId) {
      toast({ title: "Please select an HCP", variant: "destructive" });
      return;
    }
    createInteraction.mutate(
      {
        data: {
          hcpId: values.hcpId,
          type: values.type,
          date: new Date(`${values.date}T${values.time}:00`).toISOString(),
          duration: values.duration ? Number(values.duration) : undefined,
          notes: values.notes,
          productsDiscussed: selectedProducts,
          followUpRequired: values.followUpRequired,
          followUpNotes: values.followUpNotes || undefined,
        },
      },
      {
        onSuccess: (interaction) => {
          queryClient.invalidateQueries({ queryKey: getListInteractionsQueryKey({}) });
          toast({ title: "Interaction logged successfully" });
          navigate(`/interactions/${interaction.id}`);
        },
        onError: () => toast({ title: "Failed to log interaction", variant: "destructive" }),
      }
    );
  });

  const toggleProduct = (p: string) => {
    setSelectedProducts((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const addAttendee = () => {
    if (attendeeInput.trim()) {
      setAttendees((prev) => [...prev, attendeeInput.trim()]);
      setAttendeeInput("");
    }
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user" as const, content: chatInput };
    dispatch(addChatMessage(userMsg));
    setChatInput("");

    runChat.mutate(
      {
        data: {
          messages: [...chatHistory, userMsg],
          sessionId,
          hcpId: form.getValues("hcpId") || defaultHcpId,
        },
      },
      {
        onSuccess: (response) => {
          setSessionId(response.sessionId);
          dispatch(addChatMessage({ role: "assistant", content: response.message }));
          if (response.readyToLog) setChatReadyToLog(true);
          if (response.toolsUsed?.length > 0) {
            queryClient.invalidateQueries({ queryKey: getListInteractionsQueryKey({}) });
          }
          if (response.extractedData) {
            const d = response.extractedData as Record<string, unknown>;
            if (d.hcpId) form.setValue("hcpId", d.hcpId as number);
            if (d.hcpName) form.setValue("hcpName", d.hcpName as string);
            if (d.type) form.setValue("type", d.type as "visit");
            if (d.date) form.setValue("date", (d.date as string).split("T")[0]);
            if (d.notes) form.setValue("notes", d.notes as string);
            if (d.duration) form.setValue("duration", String(d.duration));
            if (d.productsDiscussed) setSelectedProducts(d.productsDiscussed as string[]);
            if (d.followUpRequired) form.setValue("followUpRequired", d.followUpRequired as boolean);
          }
        },
        onError: () => {
          dispatch(addChatMessage({ role: "assistant", content: "Sorry, I encountered an error. Please try again." }));
        },
      }
    );
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]" data-testid="log-interaction-page">
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <Link href="/interactions">
          <Button variant="ghost" size="icon" data-testid="btn-back">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Log HCP Interaction</h1>
          <p className="text-muted-foreground text-xs">Log interaction from details or chat</p>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
        {/* LEFT: Structured Form */}
        <div className="flex-1 min-w-0 overflow-y-auto rounded-xl border bg-card shadow-sm">
          <div className="p-5">
            <Form {...form}>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Section: Interaction Details */}
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                    Interaction Details
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {/* HCP Name with search */}
                    <div className="col-span-2" ref={hcpRef}>
                      <Label className="text-xs mb-1 block">HCP Name</Label>
                      <div className="relative">
                        <Input
                          placeholder="Search or select HCP..."
                          value={form.watch("hcpName") || hcpSearch}
                          onChange={(e) => {
                            setHcpSearch(e.target.value);
                            if (form.getValues("hcpId")) {
                              form.setValue("hcpId", 0);
                              form.setValue("hcpName", "");
                            }
                            setShowHcpDropdown(true);
                          }}
                          onFocus={() => setShowHcpDropdown(true)}
                          className="text-sm"
                          data-testid="input-hcp-search"
                        />
                        {showHcpDropdown && hcpsData?.hcps && hcpsData.hcps.length > 0 && !form.getValues("hcpId") && (
                          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {hcpsData.hcps.map((hcp) => (
                              <button
                                key={hcp.id}
                                type="button"
                                className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex justify-between items-center"
                                onClick={() => {
                                  form.setValue("hcpId", hcp.id);
                                  form.setValue("hcpName", `Dr. ${hcp.firstName} ${hcp.lastName}`);
                                  setHcpSearch("");
                                  setShowHcpDropdown(false);
                                }}
                                data-testid={`hcp-option-${hcp.id}`}
                              >
                                <span>Dr. {hcp.firstName} {hcp.lastName}</span>
                                <span className="text-xs text-muted-foreground">{hcp.specialty}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Interaction Type */}
                    <FormField control={form.control} name="type" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Interaction Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="text-sm" data-testid="select-type">
                            <SelectValue />
                          </SelectTrigger>
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

                    {/* Date */}
                    <FormField control={form.control} name="date" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Date</FormLabel>
                        <FormControl>
                          <Input type="date" className="text-sm" {...field} data-testid="input-date" />
                        </FormControl>
                      </FormItem>
                    )} />

                    {/* Time */}
                    <FormField control={form.control} name="time" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Time</FormLabel>
                        <FormControl>
                          <Input type="time" className="text-sm" {...field} data-testid="input-time" />
                        </FormControl>
                      </FormItem>
                    )} />

                    {/* Duration */}
                    <FormField control={form.control} name="duration" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Duration (min)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g. 30" className="text-sm" {...field} data-testid="input-duration" />
                        </FormControl>
                      </FormItem>
                    )} />
                  </div>
                </div>

                {/* Attendees */}
                <div>
                  <Label className="text-xs mb-1 block">Attendees</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Enter names or search..."
                      value={attendeeInput}
                      onChange={(e) => setAttendeeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAttendee(); } }}
                      className="text-sm"
                      data-testid="input-attendees"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addAttendee}>
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  {attendees.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {attendees.map((a, i) => (
                        <Badge key={i} variant="secondary" className="gap-1 text-xs">
                          {a}
                          <button type="button" onClick={() => setAttendees((prev) => prev.filter((_, j) => j !== i))}>
                            <Trash2 className="size-2.5" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Topics / Notes */}
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Topics Discussed</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter key discussion points..."
                        className="text-sm min-h-[90px] resize-none"
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                  </FormItem>
                )} />

                {/* Voice note shortcut */}
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                  data-testid="btn-voice-note"
                >
                  <Mic className="size-3" />
                  Summarize from Voice Note (Coming soon)
                </button>

                {/* Products / Materials */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                    Materials Shared / Samples Distributed
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRODUCTS.map((p) => (
                      <Badge
                        key={p}
                        variant={selectedProducts.includes(p) ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleProduct(p)}
                        data-testid={`badge-product-${p}`}
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                  {selectedProducts.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">No materials added.</p>
                  )}
                </div>

                {/* Follow-up */}
                <FormField control={form.control} name="followUpRequired" render={({ field }) => (
                  <FormItem className="flex items-center gap-3 rounded-lg border p-3">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-follow-up" />
                    </FormControl>
                    <div>
                      <FormLabel className="text-sm !mt-0">Follow-up required</FormLabel>
                    </div>
                  </FormItem>
                )} />

                {form.watch("followUpRequired") && (
                  <FormField control={form.control} name="followUpNotes" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Follow-up Notes</FormLabel>
                      <FormControl>
                        <Input placeholder="What needs to happen?" className="text-sm" {...field} data-testid="input-follow-up-notes" />
                      </FormControl>
                    </FormItem>
                  )} />
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createInteraction.isPending}
                  data-testid="btn-submit-interaction"
                >
                  {createInteraction.isPending ? "Logging..." : "Log Interaction"}
                </Button>
              </form>
            </Form>
          </div>
        </div>

        {/* RIGHT: AI Assistant */}
        <div className="w-80 shrink-0 flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="size-6 rounded-full bg-primary flex items-center justify-center">
                <Bot className="size-3.5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">AI Assistant</p>
                <p className="text-xs text-muted-foreground">Log interaction from chat</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-3" ref={scrollRef as unknown as React.RefObject<HTMLDivElement>}>
            {chatHistory.length === 0 ? (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 p-3 text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                Log interaction details here (e.g. "Met Dr. Smith, discussed Product efficacy, positive sentiment, shared brochure") or ask for help.
              </div>
            ) : (
              <div className="space-y-3">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                    data-testid={`chat-message-${i}`}
                  >
                    <div className={cn(
                      "flex-shrink-0 size-6 rounded-full flex items-center justify-center",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {msg.role === "user" ? <User className="size-3" /> : <Bot className="size-3" />}
                    </div>
                    <div className={cn(
                      "max-w-[85%] rounded-lg px-2.5 py-2 text-xs leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {runChat.isPending && (
                  <div className="flex gap-2">
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Bot className="size-3" />
                    </div>
                    <div className="bg-muted rounded-lg px-2.5 py-2 space-y-1.5">
                      <Skeleton className="h-2.5 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                )}
                {chatReadyToLog && (
                  <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>Interaction logged!</span>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-2.5">
            {chatHistory.length > 0 && (
              <button
                type="button"
                className="text-xs text-muted-foreground hover:text-foreground mb-2 block"
                onClick={() => { dispatch(clearChatHistory()); setSessionId(undefined); setChatReadyToLog(false); }}
                data-testid="btn-clear-chat"
              >
                Clear conversation
              </button>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                className="min-h-[38px] max-h-[80px] resize-none text-xs flex-1"
                placeholder="Describe interaction..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleChatKeyDown}
                data-testid="input-chat-message"
              />
              <Button
                size="sm"
                className="shrink-0 px-3"
                onClick={handleChatSend}
                disabled={runChat.isPending || !chatInput.trim()}
                data-testid="btn-send-chat"
              >
                Log
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
