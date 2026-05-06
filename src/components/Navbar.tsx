import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sparkles, LogOut } from "lucide-react";
import { useApp } from "@/state/AppState";
import { CoinBadge } from "@/components/CoinBadge";
import { Button } from "@/components/ui/button";

type Props = { variant?: "public" | "app" };

export const Navbar = ({ variant = "public" }: Props) => {
  const { authed, signOut } = useApp();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link to={authed ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold tracking-tight">FreelanceCoach</span>
        </Link>

        {variant === "public" ? (
          <nav className="flex items-center gap-2">
            <NavLink to="/coins" className="hidden text-sm text-muted-foreground hover:text-foreground sm:inline-block px-3 py-2">
              Pricing
            </NavLink>
            <Button asChild variant="ghost" size="sm">
              <Link to="/signin">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full">
              <Link to="/signup">Get Started</Link>
            </Button>
          </nav>
        ) : (
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link to="/coins"><CoinBadge /></Link>
            <Button onClick={handleSignOut} variant="ghost" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </nav>
        )}
      </div>
    </header>
  );
};
