import { Navigate } from "react-router-dom";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "../supabase";

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setLoading(false);
    };

    checkUser();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading..</div>;
  }

  if (!hasSession) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
};