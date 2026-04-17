import { Router } from "express";
import { db } from "@workspace/db";
import { interactionsTable, hcpsTable, insertInteractionSchema } from "@workspace/db";
import { eq, sql, count, and, gte, lt } from "drizzle-orm";
import {
  ListInteractionsQueryParams,
  CreateInteractionBody,
  GetInteractionParams,
  UpdateInteractionParams,
  UpdateInteractionBody,
  DeleteInteractionParams,
  GetHcpInteractionsParams,
} from "@workspace/api-zod";

const router = Router();

const formatInteraction = (i: typeof interactionsTable.$inferSelect, hcpName: string) => ({
  ...i,
  hcpName,
  date: i.date.toISOString(),
  followUpDate: i.followUpDate?.toISOString() ?? null,
  createdAt: i.createdAt.toISOString(),
  updatedAt: i.updatedAt.toISOString(),
});

router.get("/", async (req, res) => {
  const query = ListInteractionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query", message: query.error.message });
    return;
  }

  const { hcpId, type, limit = 20, offset = 0 } = query.data;

  const conditions = [];
  if (hcpId) conditions.push(eq(interactionsTable.hcpId, Number(hcpId)));
  if (type) conditions.push(eq(interactionsTable.type, type));

  const whereClause = conditions.length > 1
    ? and(...conditions)
    : conditions.length === 1
    ? conditions[0]
    : undefined;

  const [interactions, [{ total }], hcps] = await Promise.all([
    db
      .select({
        interaction: interactionsTable,
        hcpFirstName: hcpsTable.firstName,
        hcpLastName: hcpsTable.lastName,
      })
      .from(interactionsTable)
      .leftJoin(hcpsTable, eq(interactionsTable.hcpId, hcpsTable.id))
      .where(whereClause)
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy(sql`${interactionsTable.date} DESC`),
    db.select({ total: count() }).from(interactionsTable).where(whereClause),
    Promise.resolve([]),
  ]);

  res.json({
    interactions: interactions.map(({ interaction, hcpFirstName, hcpLastName }) =>
      formatInteraction(interaction, `${hcpFirstName ?? ""} ${hcpLastName ?? ""}`.trim()),
    ),
    total: Number(total),
    limit: Number(limit),
    offset: Number(offset),
  });
});

router.post("/", async (req, res) => {
  const body = CreateInteractionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", message: body.error.message });
    return;
  }

  const [hcp] = await db.select().from(hcpsTable).where(eq(hcpsTable.id, body.data.hcpId));
  if (!hcp) {
    res.status(404).json({ error: "Not found", message: "HCP not found" });
    return;
  }

  const [interaction] = await db
    .insert(interactionsTable)
    .values({
      hcpId: body.data.hcpId,
      type: body.data.type,
      date: body.data.date instanceof Date ? body.data.date : new Date(body.data.date as unknown as string),
      duration: body.data.duration ?? null,
      notes: body.data.notes,
      productsDiscussed: (body.data.productsDiscussed as string[]) ?? [],
      followUpRequired: body.data.followUpRequired ?? false,
      followUpDate: body.data.followUpDate
        ? (body.data.followUpDate instanceof Date ? body.data.followUpDate : new Date(body.data.followUpDate as unknown as string))
        : null,
      followUpNotes: body.data.followUpNotes ?? null,
    })
    .returning();

  await db
    .update(hcpsTable)
    .set({
      totalInteractions: sql`${hcpsTable.totalInteractions} + 1`,
      lastInteractionDate: interaction.date,
    })
    .where(eq(hcpsTable.id, body.data.hcpId));

  res.status(201).json(formatInteraction(interaction, `${hcp.firstName} ${hcp.lastName}`));
});

router.get("/:id", async (req, res) => {
  const params = GetInteractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid params", message: params.error.message });
    return;
  }

  const [result] = await db
    .select({
      interaction: interactionsTable,
      hcpFirstName: hcpsTable.firstName,
      hcpLastName: hcpsTable.lastName,
    })
    .from(interactionsTable)
    .leftJoin(hcpsTable, eq(interactionsTable.hcpId, hcpsTable.id))
    .where(eq(interactionsTable.id, params.data.id));

  if (!result) {
    res.status(404).json({ error: "Not found", message: "Interaction not found" });
    return;
  }

  res.json(formatInteraction(result.interaction, `${result.hcpFirstName ?? ""} ${result.hcpLastName ?? ""}`.trim()));
});

router.put("/:id", async (req, res) => {
  const params = UpdateInteractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid params", message: params.error.message });
    return;
  }

  const body = UpdateInteractionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", message: body.error.message });
    return;
  }

  const existing = await db
    .select({ interaction: interactionsTable, hcpFirstName: hcpsTable.firstName, hcpLastName: hcpsTable.lastName })
    .from(interactionsTable)
    .leftJoin(hcpsTable, eq(interactionsTable.hcpId, hcpsTable.id))
    .where(eq(interactionsTable.id, params.data.id));

  if (!existing.length) {
    res.status(404).json({ error: "Not found", message: "Interaction not found" });
    return;
  }

  const updateData: Partial<typeof interactionsTable.$inferInsert> = {};
  if (body.data.type !== undefined) updateData.type = body.data.type;
  if (body.data.notes !== undefined) updateData.notes = body.data.notes;
  if (body.data.duration !== undefined) updateData.duration = body.data.duration;
  if (body.data.productsDiscussed !== undefined) updateData.productsDiscussed = body.data.productsDiscussed as string[];
  if (body.data.followUpRequired !== undefined) updateData.followUpRequired = body.data.followUpRequired;
  if (body.data.followUpDate !== undefined) {
    updateData.followUpDate = body.data.followUpDate
      ? (body.data.followUpDate instanceof Date ? body.data.followUpDate : new Date(body.data.followUpDate as unknown as string))
      : null;
  }
  if (body.data.followUpNotes !== undefined) updateData.followUpNotes = body.data.followUpNotes;
  if (body.data.date !== undefined) {
    updateData.date = body.data.date instanceof Date ? body.data.date : new Date(body.data.date as unknown as string);
  }

  const [updated] = await db
    .update(interactionsTable)
    .set(updateData)
    .where(eq(interactionsTable.id, params.data.id))
    .returning();

  const hcpName = `${existing[0].hcpFirstName ?? ""} ${existing[0].hcpLastName ?? ""}`.trim();
  res.json(formatInteraction(updated, hcpName));
});

router.delete("/:id", async (req, res) => {
  const params = DeleteInteractionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid params", message: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(interactionsTable)
    .where(eq(interactionsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Not found", message: "Interaction not found" });
    return;
  }

  if (deleted.hcpId) {
    await db
      .update(hcpsTable)
      .set({ totalInteractions: sql`GREATEST(0, ${hcpsTable.totalInteractions} - 1)` })
      .where(eq(hcpsTable.id, deleted.hcpId));
  }

  res.status(204).send();
});

export default router;
