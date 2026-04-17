import { Router } from "express";
import { db } from "@workspace/db";
import { interactionsTable, hcpsTable } from "@workspace/db";
import { eq, sql, count, gte, and } from "drizzle-orm";

const router = Router();

router.get("/summary", async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const [
    [{ totalHcps }],
    [{ totalInteractions }],
    [{ interactionsThisMonth }],
    [{ interactionsThisWeek }],
    [{ pendingFollowUps }],
    byType,
    bySpecialty,
    recentRows,
  ] = await Promise.all([
    db.select({ totalHcps: count() }).from(hcpsTable),
    db.select({ totalInteractions: count() }).from(interactionsTable),
    db
      .select({ interactionsThisMonth: count() })
      .from(interactionsTable)
      .where(gte(interactionsTable.date, startOfMonth)),
    db
      .select({ interactionsThisWeek: count() })
      .from(interactionsTable)
      .where(gte(interactionsTable.date, startOfWeek)),
    db
      .select({ pendingFollowUps: count() })
      .from(interactionsTable)
      .where(
        and(
          eq(interactionsTable.followUpRequired, true),
          sql`${interactionsTable.followUpDate} IS NULL OR ${interactionsTable.followUpDate} >= NOW()`,
        ),
      ),
    db
      .select({ type: interactionsTable.type, count: count() })
      .from(interactionsTable)
      .groupBy(interactionsTable.type),
    db
      .select({ specialty: hcpsTable.specialty, count: count() })
      .from(hcpsTable)
      .groupBy(hcpsTable.specialty),
    db
      .select({
        interaction: interactionsTable,
        hcpFirstName: hcpsTable.firstName,
        hcpLastName: hcpsTable.lastName,
      })
      .from(interactionsTable)
      .leftJoin(hcpsTable, eq(interactionsTable.hcpId, hcpsTable.id))
      .orderBy(sql`${interactionsTable.date} DESC`)
      .limit(5),
  ]);

  res.json({
    totalHcps: Number(totalHcps),
    totalInteractions: Number(totalInteractions),
    interactionsThisMonth: Number(interactionsThisMonth),
    interactionsThisWeek: Number(interactionsThisWeek),
    pendingFollowUps: Number(pendingFollowUps),
    byType: byType.map((b) => ({ type: b.type, count: Number(b.count) })),
    bySpecialty: bySpecialty.map((b) => ({ specialty: b.specialty, count: Number(b.count) })),
    recentInteractions: recentRows.map(({ interaction, hcpFirstName, hcpLastName }) => ({
      ...interaction,
      hcpName: `${hcpFirstName ?? ""} ${hcpLastName ?? ""}`.trim(),
      date: interaction.date.toISOString(),
      followUpDate: interaction.followUpDate?.toISOString() ?? null,
      createdAt: interaction.createdAt.toISOString(),
      updatedAt: interaction.updatedAt.toISOString(),
    })),
  });
});

export default router;
