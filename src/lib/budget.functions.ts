import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const saveSchema = z.object({
  income: z.number().positive(),
  people: z.number().int().min(1).max(50),
  hasRent: z.boolean(),
  goal: z.enum(["save", "debt", "survive"]),
  lines: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      emoji: z.string(),
      percent: z.number(),
      monthly: z.number(),
      weekly: z.number(),
    })
  ),
});

export const saveCalculation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("budget_calculations").insert({
      user_id: context.userId,
      income: data.income,
      people: data.people,
      has_rent: data.hasRent,
      goal: data.goal,
      lines: data.lines,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listCalculations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("budget_calculations")
      .select("id, income, people, has_rent, goal, lines, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
