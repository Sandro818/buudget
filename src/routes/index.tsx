import { createFileRoute, Link } from "@tanstack/react-router";

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
          "Un outil simple pour répartir votre revenu mensuel en gourdes et garder l'historique de vos budgets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Accueil,
});

const POSTES = [
  { emoji: "🏠", label: "Logement" },
  { emoji: "🍚", label: "Nourriture" },
  { emoji: "🚌", label: "Transport" },
  { emoji: "📚", label: "École" },
  { emoji: "💊", label: "Santé" },
  { emoji: "🛡️", label: "Imprévus" },
  { emoji: "💰", label: "Épargne" },
];

function Accueil() {
  return (
    <main className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl text-primary-foreground shadow-lg shadow-primary/20">
            💰
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Bidjè
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted-foreground">
            Planifiez simplement votre budget mensuel en gourdes, et gardez l'historique de
            vos calculs dans votre compte.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary-600 sm:w-auto"
            >
              Se connecter
            </Link>
            <Link
              to="/calculer"
              className="w-full rounded-xl border border-input bg-background px-6 py-3.5 text-base font-semibold text-foreground transition hover:bg-accent sm:w-auto"
            >
              Planifier mon mois
            </Link>
          </div>
        </header>

        <section className="mt-12 rounded-2xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border sm:p-8">
          <h2 className="text-xl font-semibold text-foreground">Ce que Bidjè calcule</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Un montant conseillé par poste, le pourcentage de votre revenu et une enveloppe
            par semaine.
          </p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {POSTES.map((poste) => (
              <li
                key={poste.label}
                className="rounded-xl border border-border bg-background p-4 text-center"
              >
                <span className="text-2xl">{poste.emoji}</span>
                <p className="mt-1 text-sm font-medium text-foreground">{poste.label}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Créez un compte gratuit avec votre email pour enregistrer chaque calcul.
        </p>
      </div>
    </main>
  );
}
