import { Router } from "express";
import { RunAiAgentBody, RunAiChatBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router = Router();

const AI_BACKEND_URL = process.env.PYTHON_AI_URL ?? "http://localhost:8000";

async function proxyToAI(path: string, body: unknown) {
  const res = await fetch(`${AI_BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`AI backend error ${res.status}: ${err}`);
  }

  return res.json();
}

router.post("/agent", async (req, res) => {
  const body = RunAiAgentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", message: body.error.message });
    return;
  }

  try {
    const result = await proxyToAI("/agent", body.data);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "AI agent error");
    res.status(500).json({ error: "AI error", message: String(err) });
  }
});

router.post("/agent/chat", async (req, res) => {
  const body = RunAiChatBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", message: body.error.message });
    return;
  }

  try {
    const result = await proxyToAI("/chat", body.data);
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    res.status(500).json({ error: "AI error", message: String(err) });
  }
});

export default router;
