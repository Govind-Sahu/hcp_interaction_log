import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const hcpsTable = pgTable("hcps", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  specialty: text("specialty").notNull(),
  institution: text("institution").notNull(),
  territory: text("territory").notNull(),
  email: text("email"),
  phone: text("phone"),
  npi: text("npi"),
  tier: text("tier").notNull().default("B"),
  totalInteractions: integer("total_interactions").notNull().default(0),
  lastInteractionDate: timestamp("last_interaction_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertHcpSchema = createInsertSchema(hcpsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  totalInteractions: true,
  lastInteractionDate: true,
});
export type InsertHcp = z.infer<typeof insertHcpSchema>;
export type Hcp = typeof hcpsTable.$inferSelect;
