import { Router } from "express";
import { db } from "@workspace/db";
import { hcpsTable, insertHcpSchema } from "@workspace/db";
import { eq, ilike, or, sql, count } from "drizzle-orm";
import {
  ListHcpsQueryParams,
  CreateHcpBody,
  GetHcpParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const query = ListHcpsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Invalid query", message: query.error.message });
    return;
  }

  const { search, specialty, territory, limit = 20, offset = 0 } = query.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(hcpsTable.firstName, `%${search}%`),
        ilike(hcpsTable.lastName, `%${search}%`),
        ilike(hcpsTable.specialty, `%${search}%`),
        ilike(hcpsTable.institution, `%${search}%`),
      )!,
    );
  }
  if (specialty) {
    conditions.push(ilike(hcpsTable.specialty, `%${specialty}%`));
  }
  if (territory) {
    conditions.push(ilike(hcpsTable.territory, `%${territory}%`));
  }

  const whereClause = conditions.length > 0 ? conditions[0] : undefined;

  const [hcps, [{ total }]] = await Promise.all([
    db
      .select()
      .from(hcpsTable)
      .where(whereClause)
      .limit(Number(limit))
      .offset(Number(offset))
      .orderBy(hcpsTable.lastName),
    db.select({ total: count() }).from(hcpsTable).where(whereClause),
  ]);

  res.json({
    hcps: hcps.map((h) => ({
      ...h,
      lastInteractionDate: h.lastInteractionDate?.toISOString() ?? null,
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
    })),
    total: Number(total),
    limit: Number(limit),
    offset: Number(offset),
  });
});

router.post("/", async (req, res) => {
  const body = CreateHcpBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Invalid body", message: body.error.message });
    return;
  }

  const parsed = insertHcpSchema.safeParse(body.data);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid data", message: parsed.error.message });
    return;
  }

  const [hcp] = await db.insert(hcpsTable).values(parsed.data).returning();
  res.status(201).json({
    ...hcp,
    lastInteractionDate: hcp.lastInteractionDate?.toISOString() ?? null,
    createdAt: hcp.createdAt.toISOString(),
    updatedAt: hcp.updatedAt.toISOString(),
  });
});

router.get("/:id", async (req, res) => {
  const params = GetHcpParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: "Invalid params", message: params.error.message });
    return;
  }

  const [hcp] = await db
    .select()
    .from(hcpsTable)
    .where(eq(hcpsTable.id, params.data.id));

  if (!hcp) {
    res.status(404).json({ error: "Not found", message: "HCP not found" });
    return;
  }

  res.json({
    ...hcp,
    lastInteractionDate: hcp.lastInteractionDate?.toISOString() ?? null,
    createdAt: hcp.createdAt.toISOString(),
    updatedAt: hcp.updatedAt.toISOString(),
  });
});

export default router;
