import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — Bidjè" },
      {
        name: "description",
        content:
          "Connectez-vous ou créez votre compte Bidjè pour enregistrer et retrouver vos budgets mensuels en gourdes.",
      },
      { property: "og:title", content: "Connexion — Bidjè" },
      {
        property: "og:description",
        content: "Accédez à votre compte Bidjè et gardez l'historique de vos budgets.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/calculer", replace: true });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/calculer`,
          data: { display_name: displayName },
        },
      });
      if (signUpError) setError(traduireErreur(signUpError.message));
      else
        setMessage(
          "Compte créé ! Vérifiez votre boîte email et cliquez sur le lien de confirmation pour vous connecter."
        );
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) setError(traduireErreur(signInError.message));
      else navigate({ to: "/calculer", replace: true });
    }
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:underline">
            ← Retour à l'accueil
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Bidjè</h1>
          <p className="mt-2 text-muted-foreground">
            {mode === "login"
              ? "Connectez-vous pour retrouver vos budgets."
              : "Créez votre compte pour enregistrer vos budgets."}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl bg-card p-6 shadow-lg shadow-primary/5 ring-1 ring-border sm:p-8"
        >
          {mode === "signup" && (
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-foreground">
                Votre nom
              </label>
              <input
                id="name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ex. Jean Baptiste"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Adresse email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Au moins 6 caractères"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
          )}
          {message && (
            <p className="rounded-xl bg-primary-50 p-3 text-sm text-primary-900">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary-600 disabled:opacity-50"
          >
            {loading
              ? "Un instant…"
              : mode === "login"
                ? "Se connecter"
                : "Créer mon compte"}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Pas encore de compte ?" : "Vous avez déjà un compte ?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
                setMessage(null);
              }}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login" ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}

function traduireErreur(message: string): string {
  if (message.includes("Invalid login credentials"))
    return "Email ou mot de passe incorrect.";
  if (message.includes("Email not confirmed"))
    return "Votre email n'est pas encore confirmé. Vérifiez votre boîte email.";
  if (message.includes("already registered") || message.includes("already been registered"))
    return "Cette adresse email a déjà un compte.";
  if (message.includes("Password should be"))
    return "Le mot de passe doit contenir au moins 6 caractères.";
  return message;
}
