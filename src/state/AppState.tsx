import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type HistoryItem = {
  id: string;
  tool: "AI Coach" | "Invoice Builder";
  title: string;
  at: number;
};

type AppState = {
  coins: number;
  setCoins: (n: number | ((prev: number) => number)) => void;
  authed: boolean;
  signIn: () => void;
  signOut: () => void;
  history: HistoryItem[];
  addHistory: (item: Omit<HistoryItem, "id" | "at">) => void;
};

const Ctx = createContext<AppState | null>(null);

const STORAGE = "freelancecoach-state-v1";

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [coins, setCoinsState] = useState<number>(500);
  const [authed, setAuthed] = useState<boolean>(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed.coins === "number") setCoinsState(parsed.coins);
        if (typeof parsed.authed === "boolean") setAuthed(parsed.authed);
        if (Array.isArray(parsed.history)) setHistory(parsed.history);
      }
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify({ coins, authed, history }));
  }, [coins, authed, history]);

  const setCoins = (n: number | ((prev: number) => number)) =>
    setCoinsState((prev) => Math.max(0, typeof n === "function" ? (n as any)(prev) : n));

  const signIn = () => setAuthed(true);
  const signOut = () => setAuthed(false);

  const addHistory: AppState["addHistory"] = (item) => {
    setHistory((prev) =>
      [{ ...item, id: crypto.randomUUID(), at: Date.now() }, ...prev].slice(0, 5)
    );
  };

  return (
    <Ctx.Provider value={{ coins, setCoins, authed, signIn, signOut, history, addHistory }}>
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used within AppProvider");
  return v;
};
