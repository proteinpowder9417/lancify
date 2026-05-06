import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { useApp } from "@/state/AppState";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const plans = [
  {
    name: "Start",
    price: 7.99,
    coins: 10,
    bonus: 0,
    features: ["10 coins / month", "Best for trying things out", "Cancel anytime"],
    highlight: false,
  },
  {
    name: "Growth",
    price: 12.99,
    coins: 25,
    bonus: 10,
    features: ["25 coins + 10 bonus", "Ideal for active freelancers", "Priority chat speed"],
    highlight: true,
  },
  {
    name: "Professional",
    price: 19.99,
    coins: 50,
    bonus: 15,
    features: ["50 coins + 15 bonus", "For client-heavy weeks", "Save unlimited invoices"],
    highlight: false,
  },
  {
    name: "Test",
    price: 1,
    coins: 4000,
    bonus: 0,
    features: ["Test", "Test", "Test"],
    highlight: false,
  }
];

export default function Coins() {
  const { authed, setCoins } = useApp();
  const navigate = useNavigate();

  const buy = (total: number, name: string) => {
    setCoins((c) => c + total);
    toast.success(`Added ${total} coins from ${name} plan`);
    if (authed) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background bg-hero">
      <Navbar variant={authed ? "app" : "public"} />
      <main className="container py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Pricing
          </span>
          <h1 className="mt-5 text-3xl font-bold sm:text-4xl">Buy coins, your way</h1>
          <p className="mt-3 text-muted-foreground">Coins power AI coaching and invoice generation. Upgrade or cancel anytime.</p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-3">
          {plans.map((p, i) => {
            const total = p.coins + p.bonus;
            return (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-2xl border bg-card p-6 shadow-card transition hover:-translate-y-0.5 ${p.highlight ? "border-primary/40 shadow-glow" : "border-border"
                  }`}
                style={{ animation: `fade-in-up 0.5s ${i * 0.08}s both` }}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
                    Best
                  </span>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-bold tracking-tight">${p.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
                <div className="mt-2 inline-flex w-fit items-center gap-1.5 rounded-full bg-coin-soft px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-coin/20">
                  {p.coins} coins
                  {p.bonus > 0 && <span className="text-coin">+ {p.bonus} free</span>}
                </div>
                <ul className="mt-5 space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => buy(total, p.name)}
                  className={`mt-6 w-full rounded-full ${p.highlight ? "shadow-glow" : ""}`}
                  variant={p.highlight ? "default" : "secondary"}
                >
                  Choose {p.name}
                </Button>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-muted-foreground">
          Example
        </p>
      </main>
    </div>
  );
}
