import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveCalculation, listCalculations } from "@/lib/budget.functions";
import { askConseil } from "@/lib/conseil.functions";
import {
  GOALS,
  calculateBudget,
  formatHTG,
  formatPercent,
  getAdvice,
  goalLabel,
  type GoalId,
  type BudgetLine,
} from "@/lib/budget";

export const Route = createFileRoute("/_authenticated/calculer")({
  head: () => ({
    meta: [
      { title: "Mon budget — Bidjè" },
      {
        name: "description",
        content:
          "Calculez votre budget mensuel en gourdes et consultez l'historique de vos vingt derniers calculs.",
      },
      { property: "og:title", content: "Mon budget — Bidjè" },
      {
        property: "og:description",
        content: "Votre plan mensuel en gourdes, enregistré dans votre compte Bidjè.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calculer,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center px-4 text-center">
      <p className="text-muted-foreground">Une erreur est survenue : {error.message}</p>
    </main>
  ),
});

function Calculer() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchHistory = useServerFn(listCalculations);
  const save = useServerFn(saveCalculation);

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

  const canCalculate = typeof income === "number" && income > 0 && people >= 1;

  const history = useQuery({
    queryKey: ["budget-history"],
    queryFn: () => fetchHistory({ data: undefined }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: {
      income: number;
      people: number;
      hasRent: boolean;
      goal: GoalId;
      lines: BudgetLine[];
    }) => save({ data: payload }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["budget-history"] }),
  });

  const handleCalculate = () => {
    if (!canCalculate) return;
    setShowResults(true);
    saveMutation.mutate({
      income: numericIncome,
      people,
      hasRent,
      goal,
      lines: results,
    });
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground shadow-lg shadow-primary/20">
                💰
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Bidjè</h1>
                <p className="text-sm text-muted-foreground">Votre budget en gourdes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Se déconnecter
            </button>
          </div>
        </header>

        <section className="rounded-2xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border sm:p-8">
          <h2 className="mb-6 text-xl font-semibold text-foreground">Votre situation</h2>

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
            Planifier mon mois
          </button>
          {saveMutation.isPending && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Enregistrement en cours…
            </p>
          )}
          {saveMutation.isError && (
            <p className="mt-3 text-center text-sm text-destructive">
              Le calcul n'a pas pu être enregistré.
            </p>
          )}
        </section>

        {showResults && canCalculate && (
          <section className="mt-8 rounded-2xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-foreground">Répartition conseillée</h2>
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
                      <p className="font-semibold text-foreground">{formatHTG(line.monthly)}</p>
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

        <section className="mt-8 rounded-2xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border sm:p-8">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Historique</h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Vos 20 derniers calculs enregistrés.
          </p>

          {history.isLoading && (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          )}
          {history.isError && (
            <p className="text-sm text-destructive">
              Impossible de charger l'historique pour le moment.
            </p>
          )}
          {history.data && history.data.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Aucun calcul pour l'instant. Faites votre premier plan ci-dessus.
            </p>
          )}

          <div className="space-y-3">
            {history.data?.map((item) => {
              const lines = (item.lines as unknown as BudgetLine[]) ?? [];
              return (
                <details
                  key={item.id}
                  className="rounded-xl border border-border bg-background p-4"
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-foreground">
                          {formatHTG(Number(item.income))}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {goalLabel(item.goal)} · {item.people}{" "}
                          {item.people > 1 ? "personnes" : "personne"} ·{" "}
                          {item.has_rent ? "avec loyer" : "sans loyer"}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </summary>
                  <ul className="mt-4 space-y-2">
                    {lines.map((line) => (
                      <li
                        key={line.key}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground">
                          {line.emoji} {line.label}
                        </span>
                        <span className="text-muted-foreground">
                          {formatHTG(line.monthly)} ({formatPercent(line.percent)})
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
