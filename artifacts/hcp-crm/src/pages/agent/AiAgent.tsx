import { useState, useRef, useEffect } from "react";
import { useRunAiAgent } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Bot, User, Send, Wrench, RefreshCw } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  log_interaction: "Log Interaction — Captures interaction data with AI summarization and entity extraction",
  edit_interaction: "Edit Interaction — Modifies existing logged interaction records",
  search_hcp: "Search HCP — Finds HCPs by name, specialty, or territory",
  get_interaction_history: "Get Interaction History — Retrieves past engagement history for an HCP",
  schedule_follow_up: "Schedule Follow-Up — Sets follow-up reminders and action items",
};

const EXAMPLE_QUERIES = [
  "Search for oncology HCPs in Mid-Atlantic",
  "Log a 45-minute visit with Dr. Sarah Chen discussing Nexavar Phase 3 data. She was very receptive.",
  "Get the interaction history for HCP ID 1",
  "Edit interaction 1 to add Afinitor to the products discussed",
  "Schedule a follow-up with HCP ID 2 for next week about the cardiology symposium",
];

export function AiAgent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  const runAgent = useRunAiAgent();

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    runAgent.mutate(
      { data: { message: input, sessionId } },
      {
        onSuccess: (response) => {
          setSessionId(response.sessionId);
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: response.response,
              toolsUsed: response.toolsUsed,
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "An error occurred. Please try again.", toolsUsed: [] },
          ]);
        },
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleReset = () => { setMessages([]); setSessionId(undefined); };

  return (
    <div className="space-y-6" data-testid="ai-agent-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Agent Playground</h1>
          <p className="text-muted-foreground mt-1">Powered by LangGraph + Groq (llama-3.3-70b-versatile)</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleReset} data-testid="btn-reset-agent">
            <RefreshCw className="size-3.5 mr-1.5" />
            New Session
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="flex flex-col" style={{ height: "65vh" }}>
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <Bot className="size-4 text-primary" />
                <CardTitle className="text-base">LangGraph Agent</CardTitle>
                {sessionId && (
                  <Badge variant="outline" className="ml-auto text-xs font-mono">
                    Session: {sessionId.slice(0, 8)}...
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef as unknown as React.RefObject<HTMLDivElement>}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <Bot className="size-10 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-muted-foreground text-sm">Send a message to interact with the AI agent.</p>
                    <p className="text-muted-foreground text-xs mt-1">The agent has 5 tools to help manage HCP interactions.</p>
                  </div>
                ) : (
                  <div className="space-y-5">
                    {messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`} data-testid={`agent-message-${i}`}>
                        <div className={`flex-shrink-0 size-7 rounded-full flex items-center justify-center ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          {msg.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
                        </div>
                        <div className="max-w-[85%] space-y-2">
                          <div className={`rounded-lg px-3 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                            {msg.content}
                          </div>
                          {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap">
                              {msg.toolsUsed.map((tool) => (
                                <Badge key={tool} variant="secondary" className="text-xs gap-1">
                                  <Wrench className="size-2.5" />
                                  {tool.replace(/_/g, " ")}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {runAgent.isPending && (
                      <div className="flex gap-3">
                        <div className="size-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                          <Bot className="size-3.5" />
                        </div>
                        <div className="bg-muted rounded-lg px-3 py-2.5 space-y-1.5">
                          <Skeleton className="h-3 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>
              <div className="border-t p-3">
                <div className="flex gap-2">
                  <Textarea
                    className="min-h-[44px] max-h-[120px] resize-none"
                    placeholder="Ask the agent anything... (Enter to send)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    data-testid="input-agent-message"
                  />
                  <Button size="icon" onClick={handleSend} disabled={runAgent.isPending || !input.trim()} data-testid="btn-send-agent">
                    <Send className="size-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Available Tools (5)</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(TOOL_DESCRIPTIONS).map(([tool, desc]) => (
                <div key={tool} className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Wrench className="size-3 text-primary" />
                    <span className="text-xs font-medium font-mono">{tool}</span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-4">{desc.split(" — ")[1]}</p>
                  <Separator className="mt-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Example Queries</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {EXAMPLE_QUERIES.map((q, i) => (
                <button
                  key={i}
                  className="w-full text-left text-xs p-2 rounded-md bg-muted hover:bg-accent transition-colors"
                  onClick={() => setInput(q)}
                  data-testid={`example-query-${i}`}
                >
                  {q}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
