import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const askSchema = z.object({
  question: z.string().min(3).max(500),
  income: z.number().nonnegative().optional(),
  people: z.number().int().min(1).max(50).optional(),
  hasRent: z.boolean().optional(),
  goal: z.string().max(40).optional(),
});

export const askConseil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => askSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Le service de conseils n'est pas configuré.");

    const { streamText } = await import("ai");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");

    const gateway = createLovableAiGatewayProvider(key);

    const contexte = [
      data.income ? `Revenu mensuel : ${data.income} HTG` : null,
      data.people ? `Personnes dans le ménage : ${data.people}` : null,
      typeof data.hasRent === "boolean"
        ? data.hasRent
          ? "Paie un loyer"
          : "Ne paie pas de loyer"
        : null,
      data.goal ? `Objectif : ${data.goal}` : null,
    ]
      .filter(Boolean)
      .join(" · ");

    try {
      const result = streamText({
        model: gateway("google/gemini-3.7-flash"),
        system:
          "Tu es le conseiller de Bidjè, une app haïtienne de budget. Réponds en français simple, sans jargon financier, adapté à la réalité d'Haïti (gourdes HTG, coût de la vie local). Donne 2 à 4 conseils courts et concrets, maximum 120 mots. Pas de longs paragraphes.",
        prompt: contexte
          ? `Situation de l'utilisateur : ${contexte}\n\nQuestion : ${data.question}`
          : data.question,
      });

      const text = await result.text;
      return { answer: text.trim() };
    } catch (error) {
      const status = (error as { statusCode?: number })?.statusCode;
      if (status === 402)
        throw new Error("Les crédits IA sont épuisés. Contactez le propriétaire de l'app.");
      if (status === 429)
        throw new Error("Trop de demandes en même temps. Réessayez dans un instant.");
      throw new Error("Le conseiller n'est pas disponible pour le moment.");
    }
  });
