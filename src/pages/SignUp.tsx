import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/state/AppState";
import { Gift } from "lucide-react";
import { supabase } from "../supabase.ts"

export default function SignUp() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      await supabase
        .from('users')
        .insert([{ id: data.user.id, coins: 500 }]);
    }

    navigate("/dashboard", { state: { isNewUser: true } });

  };

  return (
    <div className="min-h-screen bg-background bg-hero">
      <Navbar variant="public" />
      <main className="container flex items-center justify-center py-12 sm:py-20">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-card animate-fade-in-up">
          <h1 className="text-2xl font-bold">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Start coaching, invoicing, and growing today.</p>

          <div className="mt-5 flex items-start gap-3 rounded-xl bg-coin-soft p-3 ring-1 ring-coin/20">
            <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-coin" />
            <p className="text-sm text-foreground">
              <span className="font-semibold">500 free coins</span> for the first 50 users.
              <span className="block text-muted-foreground">After that, 50 coins on signup.</span>
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@name.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <Button type="submit" className="w-full rounded-full shadow-glow">Create Account</Button>
          </form>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
