import { Link } from "react-router-dom";
import { Bot, FileText, Globe, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Bot,
    title: "AI Coach",
    desc: "Ask anything about clients, pricing, contracts, or proposals. Get clear, friendly guidance.",
    available: true,
  },
  {
    icon: FileText,
    title: "Invoice Builder",
    desc: "Create polished, branded PDF invoices in seconds — with live preview while you type.",
    available: true,
  },
  {
    icon: Globe,
    title: "Landing Page Builder",
    desc: "Spin up a personal freelance landing page that converts. Coming soon.",
    available: false,
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Navbar variant="public" />

      <main className="container">
        <section className="mx-auto max-w-3xl pt-16 pb-12 text-center sm:pt-24 sm:pb-16 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Built for new freelancers
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-6xl">
            Your coach for{" "}
            <span className="text-[#2563eb]">freelancing success</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Get client advice, generate invoices, and grow your freelance business — all in one place.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-7 shadow-glow">
              <Link to="/signup">
                Get Started Free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="rounded-full">
              <Link to="/coins">See pricing</Link>
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> No credit card</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-success" /> 500 free coins for first 50 users</span>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-5 pb-24 sm:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow ${!f.available ? "opacity-60" : ""
                }`}
              style={{ animation: `fade-in-up 0.6s ${i * 0.08}s both` }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              {!f.available && (
                <span className="mt-4 inline-block rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  Coming soon
                </span>
              )}
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Lancify — calm tools for confident freelancers.
      </footer>
    </div>
  );
}
