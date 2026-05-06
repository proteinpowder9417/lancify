import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "../supabase";

export const CoinBadge = ({ className }: { className?: string }) => {
  const [dbCoins, setDbCoins] = useState<number | null>(null);

  useEffect(() => {
    const fetchLiveCoins = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('coins')
          .eq('id', user.id)
          .single();

        if (data) setDbCoins(data.coins);
      }
    };
    fetchLiveCoins();
  }, []);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-coin-soft px-3 py-1.5 text-sm font-semibold text-foreground ring-1 ring-coin/20 transition hover:ring-coin/40",
        className
      )}
      title="Your coins"
    >
      <Coins className="h-4 w-4 text-coin" />
      <span>Coins:</span>
      <span className="tabular-nums">
        {dbCoins !== null ? dbCoins : "..."}
      </span>
    </div>
  );
};