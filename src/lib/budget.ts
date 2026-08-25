export const GOALS = [
  { id: "save", label: "Épargner" },
  { id: "debt", label: "Rembourser une dette" },
  { id: "survive", label: "Tenir jusqu'à la fin du mois" },
] as const;

export type GoalId = (typeof GOALS)[number]["id"];

export interface BudgetLine {
  key: string;
  label: string;
  emoji: string;
  percent: number;
  monthly: number;
  weekly: number;
}

export const goalLabel = (goal: string) =>
  GOALS.find((g) => g.id === goal)?.label ?? goal;

export const formatHTG = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "HTG",
    maximumFractionDigits: 0,
  }).format(value);

export const formatPercent = (value: number) =>
  `${Math.round(value).toLocaleString("fr-FR")} %`;

export function calculateBudget(
  income: number,
  people: number,
  hasRent: boolean,
  goal: GoalId
): BudgetLine[] {
  const housingPct = hasRent ? 30 : 5;
  const foodPct = Math.min(25 + (people - 1) * 2, 33);
  const transportPct = 10;
  const schoolPct = people === 1 ? 5 : people <= 3 ? 8 : 15;
  const healthPct = 5;
  const unexpectedBasePct = 5;

  let foodAdjustment = 0;
  let unexpectedAdjustment = 0;
  let savingsAdjustment = 0;

  if (goal === "save") {
    foodAdjustment = -3;
    unexpectedAdjustment = -2;
    savingsAdjustment = 5;
  } else if (goal === "debt") {
    foodAdjustment = -2;
    unexpectedAdjustment = -2;
    savingsAdjustment = 4;
  } else if (goal === "survive") {
    foodAdjustment = 2;
    unexpectedAdjustment = 3;
    savingsAdjustment = -5;
  }

  const baseTotal =
    housingPct + foodPct + transportPct + schoolPct + healthPct + unexpectedBasePct;

  let savingsPct = 100 - baseTotal + savingsAdjustment;
  let unexpectedPct = unexpectedBasePct + unexpectedAdjustment;
  let finalFoodPct = foodPct + foodAdjustment;

  if (savingsPct < 0) {
    unexpectedPct += savingsPct;
    savingsPct = 0;
  }
  if (unexpectedPct < 0) {
    savingsPct += unexpectedPct;
    unexpectedPct = 0;
  }
  if (finalFoodPct < 5) {
    savingsPct += finalFoodPct - 5;
    finalFoodPct = 5;
  }

  const lines = [
    { key: "housing", label: "Logement", emoji: "🏠", percent: housingPct },
    { key: "food", label: "Nourriture", emoji: "🍚", percent: finalFoodPct },
    { key: "transport", label: "Transport", emoji: "🚌", percent: transportPct },
    { key: "school", label: "École", emoji: "📚", percent: schoolPct },
    { key: "health", label: "Santé", emoji: "💊", percent: healthPct },
    { key: "unexpected", label: "Imprévus", emoji: "🛡️", percent: unexpectedPct },
    { key: "savings", label: "Épargne", emoji: "💰", percent: savingsPct },
  ];

  return lines.map((line) => ({
    ...line,
    monthly: (income * line.percent) / 100,
    weekly: (income * line.percent) / 100 / 4,
  }));
}

export function getAdvice(goal: GoalId): string {
  switch (goal) {
    case "save":
      return "Chaque gourde compte. En mettant de côté régulièrement, vous construisez votre sécurité financière.";
    case "debt":
      return "Priorisez le remboursement de vos dettes. Une fois libéré, vous aurez plus de ressources pour vos projets.";
    case "survive":
      return "Concentrez-vous sur l'essentiel : logement, nourriture et transport. Évitez les dépenses imprévues ce mois-ci.";
  }
}
