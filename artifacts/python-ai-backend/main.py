import os
import json
import uuid
from typing import Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import psycopg2
import psycopg2.extras
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END, MessagesState
from langgraph.prebuilt import ToolNode
from datetime import datetime, timezone

app = FastAPI(title="HCP CRM AI Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

llm = ChatGroq(
    model="llama-3.3-70b-versatile",
    temperature=0.1,
    groq_api_key=GROQ_API_KEY,
)

def get_db():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    return conn


# ─────────────────────────────────────────────
# TOOL 1: Log Interaction
# ─────────────────────────────────────────────
@tool
def log_interaction(
    hcp_id: int,
    interaction_type: str,
    notes: str,
    products_discussed: list[str] = [],
    duration_minutes: Optional[int] = None,
    follow_up_required: bool = False,
    follow_up_notes: Optional[str] = None,
) -> dict:
    """
    Log a new interaction with a Healthcare Professional (HCP).
    The AI will use this to summarize notes, extract entities, and determine sentiment.
    
    Args:
        hcp_id: The ID of the HCP being visited
        interaction_type: Type of interaction (visit, call, email, virtual_meeting, conference, other)
        notes: Raw notes from the rep about the interaction
        products_discussed: List of pharmaceutical products discussed
        duration_minutes: Duration of the interaction in minutes
        follow_up_required: Whether a follow-up is needed
        follow_up_notes: Notes about the required follow-up
    """
    try:
        ai_summary_prompt = f"""Summarize this HCP interaction concisely for a CRM record.
Notes: {notes}
Products: {', '.join(products_discussed) if products_discussed else 'None'}
Provide: 1) A 1-2 sentence summary, 2) Key entities (drugs, conditions, concerns), 3) Sentiment (positive/neutral/negative).
Format: Summary: ... | Sentiment: ..."""
        
        summary_response = llm.invoke([HumanMessage(content=ai_summary_prompt)])
        ai_text = summary_response.content
        
        sentiment = "neutral"
        if "Sentiment: positive" in ai_text.lower():
            sentiment = "positive"
        elif "Sentiment: negative" in ai_text.lower():
            sentiment = "negative"
        
        summary_part = ai_text.split("|")[0].replace("Summary:", "").strip() if "|" in ai_text else ai_text
        
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute(
            """INSERT INTO interactions 
               (hcp_id, type, date, duration, notes, ai_summary, sentiment, 
                products_discussed, follow_up_required, follow_up_notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
               RETURNING id""",
            (
                hcp_id,
                interaction_type,
                datetime.now(timezone.utc),
                duration_minutes,
                notes,
                summary_part[:500],
                sentiment,
                products_discussed,
                follow_up_required,
                follow_up_notes,
            ),
        )
        result = cur.fetchone()
        
        cur.execute(
            """UPDATE hcps SET 
               total_interactions = total_interactions + 1,
               last_interaction_date = NOW()
               WHERE id = %s""",
            (hcp_id,),
        )
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "interaction_id": result["id"],
            "ai_summary": summary_part[:500],
            "sentiment": sentiment,
            "message": f"Interaction logged successfully (ID: {result['id']}). AI Summary: {summary_part[:200]}",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "message": f"Failed to log interaction: {str(e)}"}


# ─────────────────────────────────────────────
# TOOL 2: Edit Interaction
# ─────────────────────────────────────────────
@tool
def edit_interaction(
    interaction_id: int,
    notes: Optional[str] = None,
    interaction_type: Optional[str] = None,
    products_discussed: Optional[list[str]] = None,
    follow_up_required: Optional[bool] = None,
    follow_up_notes: Optional[str] = None,
    duration_minutes: Optional[int] = None,
) -> dict:
    """
    Edit/modify an existing logged interaction. Used to correct or update interaction records.
    The AI will regenerate the summary if notes are changed.
    
    Args:
        interaction_id: The ID of the interaction to edit
        notes: Updated notes (optional)
        interaction_type: Updated type (optional)
        products_discussed: Updated product list (optional)
        follow_up_required: Updated follow-up flag (optional)
        follow_up_notes: Updated follow-up notes (optional)
        duration_minutes: Updated duration (optional)
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("SELECT * FROM interactions WHERE id = %s", (interaction_id,))
        existing = cur.fetchone()
        
        if not existing:
            return {"success": False, "message": f"Interaction {interaction_id} not found"}
        
        updates = {}
        if notes is not None:
            updates["notes"] = notes
            ai_prompt = f"Summarize this updated HCP interaction note in 1-2 sentences: {notes}"
            new_summary = llm.invoke([HumanMessage(content=ai_prompt)]).content
            updates["ai_summary"] = new_summary[:500]
        if interaction_type is not None:
            updates["type"] = interaction_type
        if products_discussed is not None:
            updates["products_discussed"] = products_discussed
        if follow_up_required is not None:
            updates["follow_up_required"] = follow_up_required
        if follow_up_notes is not None:
            updates["follow_up_notes"] = follow_up_notes
        if duration_minutes is not None:
            updates["duration"] = duration_minutes
        
        if updates:
            set_clause = ", ".join([f"{k} = %s" for k in updates.keys()])
            values = list(updates.values()) + [interaction_id]
            cur.execute(
                f"UPDATE interactions SET {set_clause}, updated_at = NOW() WHERE id = %s RETURNING id",
                values,
            )
        
        cur.close()
        conn.close()
        
        return {
            "success": True,
            "interaction_id": interaction_id,
            "fields_updated": list(updates.keys()),
            "message": f"Interaction {interaction_id} updated successfully. Fields changed: {', '.join(updates.keys())}",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "message": f"Failed to edit interaction: {str(e)}"}


# ─────────────────────────────────────────────
# TOOL 3: Search HCP
# ─────────────────────────────────────────────
@tool
def search_hcp(name: Optional[str] = None, specialty: Optional[str] = None, territory: Optional[str] = None) -> dict:
    """
    Search for Healthcare Professionals (HCPs) in the CRM database by name, specialty, or territory.
    Use this to find an HCP before logging an interaction.
    
    Args:
        name: Full or partial name of the HCP
        specialty: Medical specialty (e.g., Cardiology, Oncology)
        territory: Sales territory name
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        conditions = []
        params = []
        
        if name:
            conditions.append("(first_name ILIKE %s OR last_name ILIKE %s OR (first_name || ' ' || last_name) ILIKE %s)")
            params.extend([f"%{name}%", f"%{name}%", f"%{name}%"])
        if specialty:
            conditions.append("specialty ILIKE %s")
            params.append(f"%{specialty}%")
        if territory:
            conditions.append("territory ILIKE %s")
            params.append(f"%{territory}%")
        
        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        
        cur.execute(f"SELECT id, first_name, last_name, specialty, institution, territory, tier, total_interactions FROM hcps {where} LIMIT 10", params)
        hcps = cur.fetchall()
        cur.close()
        conn.close()
        
        if not hcps:
            return {"success": True, "hcps": [], "message": "No HCPs found matching your search criteria."}
        
        hcp_list = [
            {
                "id": h["id"],
                "name": f"{h['first_name']} {h['last_name']}",
                "specialty": h["specialty"],
                "institution": h["institution"],
                "territory": h["territory"],
                "tier": h["tier"],
                "total_interactions": h["total_interactions"],
            }
            for h in hcps
        ]
        
        return {
            "success": True,
            "hcps": hcp_list,
            "count": len(hcp_list),
            "message": f"Found {len(hcp_list)} HCP(s): " + "; ".join([f"{h['name']} ({h['specialty']})" for h in hcp_list]),
        }
    except Exception as e:
        return {"success": False, "error": str(e), "message": f"Search failed: {str(e)}"}


# ─────────────────────────────────────────────
# TOOL 4: Get Interaction History
# ─────────────────────────────────────────────
@tool
def get_interaction_history(hcp_id: int, limit: int = 5) -> dict:
    """
    Retrieve the recent interaction history for a specific HCP.
    Use this to review past engagements before a new visit or to inform next steps.
    
    Args:
        hcp_id: The ID of the HCP whose interaction history to retrieve
        limit: Maximum number of recent interactions to return (default 5)
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute("SELECT first_name, last_name, specialty, tier FROM hcps WHERE id = %s", (hcp_id,))
        hcp = cur.fetchone()
        
        if not hcp:
            return {"success": False, "message": f"HCP with ID {hcp_id} not found"}
        
        cur.execute(
            """SELECT id, type, date, duration, notes, ai_summary, sentiment, 
                      products_discussed, follow_up_required, follow_up_notes
               FROM interactions WHERE hcp_id = %s 
               ORDER BY date DESC LIMIT %s""",
            (hcp_id, min(limit, 20)),
        )
        interactions = cur.fetchall()
        cur.close()
        conn.close()
        
        hcp_name = f"{hcp['first_name']} {hcp['last_name']}"
        
        history = [
            {
                "id": i["id"],
                "type": i["type"],
                "date": i["date"].strftime("%Y-%m-%d") if i["date"] else None,
                "summary": i["ai_summary"] or i["notes"][:100],
                "sentiment": i["sentiment"],
                "products": i["products_discussed"] or [],
                "follow_up": i["follow_up_required"],
            }
            for i in interactions
        ]
        
        return {
            "success": True,
            "hcp_name": hcp_name,
            "specialty": hcp["specialty"],
            "tier": hcp["tier"],
            "interactions": history,
            "total_found": len(history),
            "message": f"Found {len(history)} recent interaction(s) for {hcp_name} ({hcp['specialty']}, Tier {hcp['tier']}). Most recent: {history[0]['date'] if history else 'None'}",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "message": f"Failed to retrieve history: {str(e)}"}


# ─────────────────────────────────────────────
# TOOL 5: Schedule Follow-Up
# ─────────────────────────────────────────────
@tool
def schedule_follow_up(
    interaction_id: int,
    follow_up_date: str,
    follow_up_notes: str,
    priority: str = "medium",
) -> dict:
    """
    Schedule a follow-up action for an existing interaction.
    Use when the rep needs to set a reminder or next-step for an HCP.
    
    Args:
        interaction_id: The interaction ID to attach the follow-up to
        follow_up_date: Date for the follow-up (YYYY-MM-DD format)
        follow_up_notes: Description of what needs to be done
        priority: Priority level: low, medium, high
    """
    try:
        conn = get_db()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        
        cur.execute(
            """UPDATE interactions 
               SET follow_up_required = TRUE, follow_up_date = %s, follow_up_notes = %s, updated_at = NOW()
               WHERE id = %s RETURNING id, hcp_id""",
            (follow_up_date, f"[{priority.upper()}] {follow_up_notes}", interaction_id),
        )
        result = cur.fetchone()
        
        if not result:
            return {"success": False, "message": f"Interaction {interaction_id} not found"}
        
        cur.execute(
            "SELECT first_name, last_name FROM hcps WHERE id = %s",
            (result["hcp_id"],),
        )
        hcp = cur.fetchone()
        cur.close()
        conn.close()
        
        hcp_name = f"{hcp['first_name']} {hcp['last_name']}" if hcp else "Unknown HCP"
        
        return {
            "success": True,
            "interaction_id": interaction_id,
            "follow_up_date": follow_up_date,
            "priority": priority,
            "message": f"Follow-up scheduled for {hcp_name} on {follow_up_date} [{priority.upper()} priority]: {follow_up_notes}",
        }
    except Exception as e:
        return {"success": False, "error": str(e), "message": f"Failed to schedule follow-up: {str(e)}"}


# ─────────────────────────────────────────────
# LangGraph Agent Setup
# ─────────────────────────────────────────────
TOOLS = [log_interaction, edit_interaction, search_hcp, get_interaction_history, schedule_follow_up]
tool_node = ToolNode(TOOLS)

llm_with_tools = llm.bind_tools(TOOLS)

SYSTEM_PROMPT = """You are an AI assistant for a pharmaceutical CRM system, specialized in helping field sales representatives manage their interactions with Healthcare Professionals (HCPs).

You have access to 5 tools:
1. **log_interaction** - Log a new HCP interaction with AI summarization and entity extraction
2. **edit_interaction** - Modify an existing interaction record
3. **search_hcp** - Search for HCPs by name, specialty, or territory
4. **get_interaction_history** - Retrieve past interaction history for an HCP
5. **schedule_follow_up** - Schedule follow-up actions for interactions

Always be helpful, professional, and concise. When a user wants to log an interaction, first search for the HCP to confirm their ID, then log it. When editing, confirm what changes are being made. Always suggest follow-ups when appropriate based on the interaction context."""


def should_continue(state: MessagesState):
    last_message = state["messages"][-1]
    if last_message.tool_calls:
        return "tools"
    return END


def call_model(state: MessagesState):
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


workflow = StateGraph(MessagesState)
workflow.add_node("agent", call_model)
workflow.add_node("tools", tool_node)
workflow.set_entry_point("agent")
workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
workflow.add_edge("tools", "agent")

agent_graph = workflow.compile()


# ─────────────────────────────────────────────
# API Endpoints
# ─────────────────────────────────────────────
class AgentRequest(BaseModel):
    message: str
    sessionId: Optional[str] = None
    hcpId: Optional[int] = None
    interactionId: Optional[int] = None


class AgentResponse(BaseModel):
    response: str
    toolsUsed: list[str]
    extractedData: Optional[dict] = None
    sessionId: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    hcpId: Optional[int] = None
    sessionId: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    extractedInteraction: Optional[dict] = None
    sessionId: str
    toolsUsed: list[str]
    readyToLog: bool


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/agent", response_model=AgentResponse)
async def run_agent(request: AgentRequest):
    session_id = request.sessionId or str(uuid.uuid4())
    
    context = ""
    if request.hcpId:
        context += f" [Context: HCP ID = {request.hcpId}]"
    if request.interactionId:
        context += f" [Context: Interaction ID = {request.interactionId}]"
    
    message_content = request.message + context
    
    try:
        result = agent_graph.invoke({"messages": [HumanMessage(content=message_content)]})
        
        messages = result["messages"]
        final_response = ""
        tools_used = []
        extracted_data = None
        
        for msg in messages:
            if isinstance(msg, AIMessage):
                if msg.content:
                    final_response = msg.content
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        tools_used.append(tc["name"])
            elif isinstance(msg, ToolMessage):
                try:
                    tool_result = json.loads(msg.content) if isinstance(msg.content, str) else msg.content
                    if isinstance(tool_result, dict) and tool_result.get("success"):
                        extracted_data = tool_result
                except Exception:
                    pass
        
        return AgentResponse(
            response=final_response or "Task completed.",
            toolsUsed=list(set(tools_used)),
            extractedData=extracted_data,
            sessionId=session_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")


@app.post("/chat", response_model=ChatResponse)
async def run_chat(request: ChatRequest):
    session_id = request.sessionId or str(uuid.uuid4())
    
    lc_messages = []
    for msg in request.messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
    
    if request.hcpId and lc_messages:
        last = lc_messages[-1]
        if isinstance(last, HumanMessage):
            lc_messages[-1] = HumanMessage(content=f"{last.content} [HCP ID context: {request.hcpId}]")
    
    try:
        result = agent_graph.invoke({"messages": lc_messages})
        
        messages = result["messages"]
        final_response = ""
        tools_used = []
        extracted_interaction = None
        ready_to_log = False
        
        for msg in messages:
            if isinstance(msg, AIMessage):
                if msg.content:
                    final_response = msg.content
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        tools_used.append(tc["name"])
                        if tc["name"] == "log_interaction":
                            ready_to_log = True
                            extracted_interaction = tc.get("args", {})
            elif isinstance(msg, ToolMessage):
                try:
                    tool_result = json.loads(msg.content) if isinstance(msg.content, str) else msg.content
                    if isinstance(tool_result, dict) and "interaction_id" in tool_result:
                        ready_to_log = True
                except Exception:
                    pass
        
        return ChatResponse(
            message=final_response or "How can I help you log this interaction?",
            extractedInteraction=extracted_interaction,
            sessionId=session_id,
            toolsUsed=list(set(tools_used)),
            readyToLog=ready_to_log,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PYTHON_AI_PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
