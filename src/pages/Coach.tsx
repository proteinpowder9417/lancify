import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Info, Sparkles, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "../supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

type Msg = { id: string; role: "user" | "ai"; text: string };

const COST = 10;

export default function Coach() {
  const [dbCoins, setDbCoins] = useState<number>(0);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchCoins = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from("users").select("coins").eq("id", user.id).single();
      if (data) setDbCoins(data.coins);
    }
  };

  const fetchMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const formatted = data.map((m: any) => ({
          id: m.id,
          role: m.role,
          text: m.content
        }));
        setMessages(formatted);
      } else {
        setMessages([{ id: "intro", role: "ai", text: "Hi! I'm your AI coach. Ask me anything about clients, pricing, contracts, or proposals." }]);
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      await fetchCoins();
      await fetchMessages();
    };
    init();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const canSend = dbCoins >= COST && input.trim().length > 0 && !loading;

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;

    const text = input.trim();
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text };

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.1-flash-lite-preview",
        systemInstruction: `ROLE: Lancify AI Coach...` // Instructions condensed for brevity
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // 1. SECURE DEDUCTION: Call RPC instead of updating manually
      const { error: rpcError } = await supabase.rpc('deduct_coins_coach', {
        target_user_id: user.id,
        amount: COST
      });

      if (rpcError) {
        toast.error("Insufficient coins or payment error.");
        setMessages((m) => m.filter(msg => msg.id !== userMsg.id)); // Remove user message if payment fails
        return;
      }

      // 2. GENERATE AI RESPONSE
      const result = await model.generateContent(text);
      const aiResponse = result.response.text();

      // 3. SAVE TO DATABASE & UPDATE UI
      await supabase.from("messages").insert([
        { user_id: user.id, role: "user", content: text },
        { user_id: user.id, role: "ai", content: aiResponse }
      ]);

      setDbCoins(prev => prev - COST);
      setMessages((m) => [...m, { id: crypto.randomUUID(), role: "ai", text: aiResponse }]);

    } catch (err) {
      console.error("Coach Error:", err);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const outOfCoins = dbCoins < COST;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar variant="app" />
      <main className="container flex flex-1 flex-col py-6 sm:py-8">
        {/* ... Rest of your UI JSX remains exactly the same ... */}
        {/* (Dashboard link, Info box, Message mapping, Input form) */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> AI Coach
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-soft">
          <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Each message costs <span className="font-semibold text-foreground">{COST} coins</span>.
          </p>
        </div>

        <div ref={scrollRef} className="mt-4 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-6" style={{ minHeight: 320, maxHeight: "60vh" }}>
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in-up`}>
              <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft sm:max-w-[75%] ${m.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground"}`}>
                {m.text}
              </div>
            </div>
          ))}
          {loading && <div className="text-xs text-muted-foreground animate-pulse">Coach is thinking..</div>}
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>You have <span className="font-semibold text-foreground tabular-nums">{dbCoins}</span> coins.</span>
          </div>

          {outOfCoins ? (
            <div className="rounded-2xl border border-border bg-coin-soft p-4 text-center text-sm shadow-soft">
              <p className="font-medium text-foreground">You are out of coins.</p>
              <Button asChild size="sm" className="mt-3 rounded-full">
                <Link to="/coins">Get more coins</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={send} className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:ring-2 focus-within:ring-ring">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={1}
                placeholder="Ask your coach anything..."
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button type="submit" disabled={!canSend} className="h-10 rounded-xl px-3">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}