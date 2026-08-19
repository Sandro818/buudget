import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bidjè — Planifiez votre budget mensuel" },
      {
        name: "description",
        content:
          "Bidjè vous aide à planifier votre budget mensuel en gourdes : logement, nourriture, transport, école, santé, imprévus et épargne.",
      },
      { property: "og:title", content: "Bidjè — Planifiez votre budget mensuel" },
      {
        property: "og:description",
        content:
          "Un outil simple pour répartir votre revenu mensuel en gourdes et atteindre votre objectif financier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const GOALS = [
  { id: "save", label: "Épargner" },
  { id: "debt", label: "Rembourser une dette" },
  { id: "survive", label: "Tenir jusqu'à la fin du mois" },
] as const;

type GoalId = (typeof GOALS)[number]["id"];

interface BudgetLine {
  key: string;
  label: string;
  emoji: string;
  percent: number;
  monthly: number;
  weekly: number;
}

const formatHTG = (value: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "HTG",
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  `${Math.round(value).toLocaleString("fr-FR")} %`;

function calculateBudget(
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
    housingPct +
    foodPct +
    transportPct +
    schoolPct +
    healthPct +
    unexpectedBasePct;

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

function getAdvice(goal: GoalId): string {
  switch (goal) {
    case "save":
      return "Chaque gourde compte. En mettant de côté régulièrement, vous construisez votre sécurité financière.";
    case "debt":
      return "Priorisez le remboursement de vos dettes. Une fois libéré, vous aurez plus de ressources pour vos projets.";
    case "survive":
      return "Concentrez-vous sur l'essentiel : logement, nourriture et transport. Évitez les dépenses imprévues ce mois-ci.";
  }
}

function Index() {
  const [income, setIncome] = useState<number | "">("");
  const [people, setPeople] = useState<number>(1);
  const [hasRent, setHasRent] = useState<boolean>(true);
  const [goal, setGoal] = useState<GoalId>("survive");
  const [showResults, setShowResults] = useState(false);

  const numericIncome = typeof income === "number" ? income : 0;

  const results = useMemo(
    () => calculateBudget(numericIncome, people, hasRent, goal),
    [numericIncome, people, hasRent, goal]
  );

  const totalPercent = results.reduce((sum, line) => sum + line.percent, 0);
  const totalMonthly = results.reduce((sum, line) => sum + line.monthly, 0);

  const canCalculate =
    typeof income === "number" && income > 0 && people >= 1 && goal;

  const handleCalculate = () => {
    if (canCalculate) setShowResults(true);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-lg shadow-primary/20">
            💰
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Bidjè
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Planifiez simplement votre budget mensuel en gourdes.
          </p>
        </header>

        <section className="rounded-2xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">
            Votre situation
          </h2>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="income" className="block text-sm font-medium text-foreground">
                Revenu mensuel (HTG)
              </label>
              <input
                id="income"
                type="number"
                min={0}
                step={100}
                value={income}
                onChange={(e) =>
                  setIncome(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Ex. 75 000"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="people" className="block text-sm font-medium text-foreground">
                Personnes dans le ménage
              </label>
              <input
                id="people"
                type="number"
                min={1}
                max={20}
                value={people}
                onChange={(e) => setPeople(Math.max(1, Number(e.target.value)))}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <span className="block text-sm font-medium text-foreground">
                Payez-vous un loyer ?
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setHasRent(true)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    hasRent
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  onClick={() => setHasRent(false)}
                  className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    !hasRent
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-foreground hover:bg-accent"
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="goal" className="block text-sm font-medium text-foreground">
                Votre objectif ce mois-ci
              </label>
              <select
                id="goal"
                value={goal}
                onChange={(e) => setGoal(e.target.value as GoalId)}
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-ring"
              >
                {GOALS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="mt-8 w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Calculer mon budget
          </button>
        </section>

        {showResults && canCalculate && (
          <section className="mt-8 rounded-2xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Répartition conseillée
              </h2>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-800">
                Revenu : {formatHTG(numericIncome)}
              </span>
            </div>

            <div className="mb-6 rounded-xl bg-primary-50 p-4 text-primary-900">
              <p className="text-sm font-medium">💡 Conseil</p>
              <p className="mt-1 text-base">{getAdvice(goal)}</p>
            </div>

            <div className="space-y-4">
              {results.map((line) => (
                <div
                  key={line.key}
                  className="rounded-xl border border-border bg-background p-4 transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{line.emoji}</span>
                      <div>
                        <p className="font-medium text-foreground">{line.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatPercent(line.percent)} du revenu
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatHTG(line.monthly)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatHTG(line.weekly)} / semaine
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.max(0, Math.min(100, line.percent))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-xl bg-primary p-4 text-primary-foreground">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total réparti</span>
                <span className="text-lg font-bold">{formatHTG(totalMonthly)}</span>
              </div>
              <p className="mt-1 text-sm opacity-90">
                {formatPercent(totalPercent)} du revenu mensuel
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
