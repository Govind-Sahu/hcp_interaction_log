import { useState, useRef, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { setMode, addChatMessage, clearChatHistory } from "@/store/slices/interactionSlice";
import {
  useListHcps,
  useCreateInteraction,
  getListInteractionsQueryKey,
  useRunAiChat,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Send, Bot, User, CheckCircle2, Wrench, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const PRODUCTS = ["Nexavar", "Afinitor", "Jardiance", "Farxiga", "Keytruda", "Opdivo", "Humira", "Enbrel", "Xarelto", "Eliquis"];

export function LogInteraction() {
  const dispatch = useDispatch();
  const mode = useSelector((state: RootState) => state.interaction.mode);
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
  const [chatReadyToLog, setChatReadyToLog] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: hcpsData } = useListHcps({ limit: 100 }, { query: { queryKey: ["listHcps", "all"] } });
  const createInteraction = useCreateInteraction();
  const runChat = useRunAiChat();

  const form = useForm({
    defaultValues: {
      hcpId: defaultHcpId ?? 0,
      type: "visit" as const,
      date: new Date().toISOString().split("T")[0],
      duration: "",
      notes: "",
      followUpRequired: false,
      followUpNotes: "",
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

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
          date: new Date(`${values.date}T12:00:00`).toISOString(),
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
          hcpId: defaultHcpId,
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
    <div className="space-y-6 max-w-3xl mx-auto" data-testid="log-interaction-page">
      <div className="flex items-center gap-4">
        <Link href="/interactions">
          <Button variant="ghost" size="icon" data-testid="btn-back">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Log Interaction</h1>
          <p className="text-muted-foreground mt-0.5">Record a new HCP engagement</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <CardTitle className="text-base">Input Method</CardTitle>
            <div className="flex items-center gap-3 ml-auto">
              <span className={`text-sm font-medium ${mode === "form" ? "text-foreground" : "text-muted-foreground"}`}>
                Structured Form
              </span>
              <Switch
                checked={mode === "chat"}
                onCheckedChange={(checked) => dispatch(setMode(checked ? "chat" : "form"))}
                data-testid="toggle-interaction-mode"
              />
              <span className={`text-sm font-medium ${mode === "chat" ? "text-foreground" : "text-muted-foreground"}`}>
                AI Chat
              </span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {mode === "form" ? (
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <FormField
                  control={form.control}
                  name="hcpId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Healthcare Professional *</FormLabel>
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(Number(v))}
                      >
                        <SelectTrigger data-testid="select-hcp">
                          <SelectValue placeholder="Select an HCP" />
                        </SelectTrigger>
                        <SelectContent>
                          {hcpsData?.hcps?.map((hcp) => (
                            <SelectItem key={hcp.id} value={String(hcp.id)}>
                              Dr. {hcp.firstName} {hcp.lastName} — {hcp.specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interaction Type *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-interaction-type">
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 30" {...field} data-testid="input-duration" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <Label className="mb-2 block">Products Discussed</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCTS.map((p) => (
                      <Badge
                        key={p}
                        variant={selectedProducts.includes(p) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleProduct(p)}
                        data-testid={`badge-product-${p}`}
                      >
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interaction Notes *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the interaction, key discussion points, HCP reactions..."
                          className="min-h-[120px]"
                          {...field}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="followUpRequired"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-follow-up"
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Follow-up required</FormLabel>
                    </FormItem>
                  )}
                />

                {form.watch("followUpRequired") && (
                  <FormField
                    control={form.control}
                    name="followUpNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Notes</FormLabel>
                        <FormControl>
                          <Input placeholder="What needs to happen?" {...field} data-testid="input-follow-up-notes" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
          </CardContent>
        </Card>
      ) : (
        <Card className="flex flex-col" style={{ height: "60vh" }}>
          <CardHeader className="pb-2 border-b">
            <div className="flex items-center gap-2">
              <Bot className="size-4 text-primary" />
              <CardTitle className="text-base">AI Interaction Assistant</CardTitle>
              <Badge variant="outline" className="ml-auto text-xs">Powered by LangGraph + Groq</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Describe your HCP interaction naturally. The AI will extract details and log it for you.
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4" ref={scrollRef as unknown as React.RefObject<HTMLDivElement>}>
              {chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                  <Bot className="size-8 mb-3 opacity-50" />
                  <p className="text-sm">Start by describing your HCP interaction.</p>
                  <p className="text-xs mt-1">Example: "I visited Dr. Chen today for 30 minutes to discuss Nexavar data..."</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                      data-testid={`chat-message-${i}`}
                    >
                      <div className={`flex-shrink-0 size-7 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                        {msg.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                      </div>
                      <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {runChat.isPending && (
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 size-7 rounded-full bg-muted flex items-center justify-center">
                        <Bot className="size-3.5" />
                      </div>
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  )}
                  {chatReadyToLog && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg text-sm text-emerald-800 dark:text-emerald-200">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>Interaction has been logged successfully!</span>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            <div className="border-t p-3">
              <div className="flex gap-2">
                <Textarea
                  className="min-h-[44px] max-h-[100px] resize-none"
                  placeholder="Describe your interaction... (Enter to send, Shift+Enter for newline)"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  data-testid="input-chat-message"
                />
                <Button
                  size="icon"
                  onClick={handleChatSend}
                  disabled={runChat.isPending || !chatInput.trim()}
                  data-testid="btn-send-chat"
                >
                  <Send className="size-4" />
                </Button>
              </div>
              {chatHistory.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-muted-foreground"
                  onClick={() => { dispatch(clearChatHistory()); setSessionId(undefined); setChatReadyToLog(false); }}
                  data-testid="btn-clear-chat"
                >
                  Clear conversation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
