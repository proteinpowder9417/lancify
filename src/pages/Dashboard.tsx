import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bot, FileText, Globe, ArrowRight, History, MessageSquare, FileCheck, AlertTriangle } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";
import { supabase } from "../supabase";

const tools = [
  { to: "/coach", icon: Bot, title: "AI Coach", desc: "Get instant advice on clients, pricing, and proposals.", available: true },
  { to: "/invoice", icon: FileText, title: "Invoice Builder", desc: "Create clean PDF invoices with a live preview.", available: true },
  { to: "#", icon: Globe, title: "Landing Page Builder", desc: "Spin up your personal freelance site.", available: false },
];

const formatWhen = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function Dashboard() {
  const [dbHistory, setDbHistory] = useState<any[]>([]);
  const [profile, setProfile] = useState<{ coins: number; expiry: string } | null>(null);
  const location = useLocation();
  const isNewUser = location.state?.isNewUser;

  const fetchRecentActivity = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("coins, coins_expiry")
      .eq("id", user.id)
      .single();

    if (profileData) {
      setProfile({
        coins: profileData.coins,
        expiry: profileData.coins_expiry,
      });
    }

    const { data: inv } = await supabase
      .from("invoices")
      .select("id, invoice_number, client_name, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: msg } = await supabase
      .from("messages")
      .select("id, content, created_at")
      .eq("user_id", user.id)
      .eq("role", "user")
      .order("created_at", { ascending: false })
      .limit(5);

    const combined = [
      ...(inv || []).map(i => ({
        id: i.id,
        title: `Invoice ${i.invoice_number} - ${i.client_name}`,
        tool: "Invoice Builder",
        at: i.created_at
      })),
      ...(msg || []).map(m => ({
        id: m.id,
        title: m.content.length > 40 ? m.content.substring(0, 40) + "..." : m.content,
        tool: "AI Coach",
        at: m.created_at
      }))
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 5);

    setDbHistory(combined);
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container py-8 sm:py-12">
        {isNewUser && profile && (
          <div className="mb-8 flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 animate-in fade-in slide-in-from-top-4">
            <div>
              <h2 className="font-semibold text-primary">Starting Gift!</h2>
              <p className="text-sm text-muted-foreground">
                You got <span className="font-bold text-primary">{profile.coins} coins</span> as a starting gift.
                Coins will be removed after 1 month ({new Date(profile.expiry).toLocaleDateString()}).
              </p>
            </div>
          </div>
        )}
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-bold sm:text-3xl">Welcome 👋</h1>
          <p className="mt-1 text-muted-foreground">Pick a tool and keep building your freelance business.</p>
        </div>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t, i) => (
            <div
              key={t.title}
              className={`group relative flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-glow ${!t.available ? "opacity-60" : ""
                }`}
              style={{ animation: `fade-in-up 0.5s ${i * 0.07}s both` }}
            >
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <t.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{t.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{t.desc}</p>
              {t.available ? (
                <Button asChild className="mt-5 w-fit rounded-full">
                  <Link to={t.to}>
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <span className="mt-5 inline-block w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Coming soon
                </span>
              )}
            </div>
          ))}
        </section>

        <section className="mt-12 animate-fade-in-up">
          <div className="mb-4 flex items-center gap-2">
            <History className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Recent activity</h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            {dbHistory.length === 0 ? ( // Swapped from history to dbHistory
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-muted">
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No activity yet</p>
                <p className="mt-1 text-sm text-muted-foreground">Your last 5 actions will show up here.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {dbHistory.map((h) => { // Swapped from history to dbHistory
                  const isCoach = h.tool === "AI Coach";
                  const Icon = isCoach ? MessageSquare : FileCheck;
                  const to = isCoach ? "/coach" : "/invoice";
                  return (
                    <li key={h.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                      <div className={`grid h-9 w-9 place-items-center rounded-lg ${isCoach ? "bg-primary-soft text-primary" : "bg-success-soft text-success"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{h.title}</p>
                        <p className="text-xs text-muted-foreground">{h.tool} • {formatWhen(h.at)}</p>
                      </div>
                      <Button asChild size="sm" variant="ghost" className="rounded-full">
                        <Link to={to}>
                          Enter <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}