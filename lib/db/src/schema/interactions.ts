import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { hcpsTable } from "./hcps";

export const interactionsTable = pgTable("interactions", {
  id: serial("id").primaryKey(),
  hcpId: integer("hcp_id").notNull().references(() => hcpsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("visit"),
  date: timestamp("date", { withTimezone: true }).notNull(),
  duration: integer("duration"),
  notes: text("notes").notNull(),
  aiSummary: text("ai_summary"),
  sentiment: text("sentiment"),
  productsDiscussed: text("products_discussed").array().notNull().default([]),
  followUpRequired: boolean("follow_up_required").notNull().default(false),
  followUpDate: timestamp("follow_up_date", { withTimezone: true }),
  followUpNotes: text("follow_up_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertInteractionSchema = createInsertSchema(interactionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  aiSummary: true,
  sentiment: true,
});
export type InsertInteraction = z.infer<typeof insertInteractionSchema>;
export type Interaction = typeof interactionsTable.$inferSelect;
