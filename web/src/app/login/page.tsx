"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hammer } from "lucide-react";
import { useAuth } from "@/store/auth";
import { apiErr } from "@/lib/api";
import { ErrorNote, Spinner } from "@/components/ui";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(apiErr(err, "Invalid credentials"));
    } finally {
      setLoading(false);
    }
  };

  const demo = async () => {
    setError("");
    setLoading(true);
    try {
      await login("demo@forge.app", "demo12345");
      router.push("/dashboard");
    } catch (err) {
      setError(apiErr(err, "Demo login failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-surface-raised/50 p-10 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/15 text-brand"><Hammer size={20} /></span>
          <span className="text-lg font-bold">Forge</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Turn any spreadsheet into<br />
            <span className="bg-gradient-to-r from-brand via-amber-400 to-orange-500 bg-clip-text text-transparent">a full web app.</span>
          </h2>
          <p className="mt-3 max-w-md text-ink-muted">
            Upload CSV or Excel → get auth, CRUD, search, charts, and a REST API. Instantly.
          </p>
        </div>
        <p className="bg-gradient-to-r from-brand via-amber-300 to-orange-400 bg-clip-text text-sm font-semibold text-transparent animate-pulse">
          Built by Akshat Gupta
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2.5 mb-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand/15 text-brand"><Hammer size={20} /></span>
            <span className="text-lg font-bold">Forge</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-muted">Sign in to your account</p>
          </div>
          <ErrorNote message={error} />
          <form onSubmit={submit} className="space-y-4">
            <div><label className="lbl">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="you@example.com" required /></div>
            <div><label className="lbl">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Spinner className="h-4 w-4" /> : "Sign in"}</button>
          </form>
          <button onClick={demo} disabled={loading} className="btn-ghost w-full text-xs">Try demo account</button>
          <p className="text-center text-sm text-ink-muted">
            No account?{" "}
            <Link href="/register" className="font-medium text-brand hover:underline">Create one</Link>
          </p>
          <p className="lg:hidden text-center bg-gradient-to-r from-brand via-amber-300 to-orange-400 bg-clip-text text-xs font-semibold text-transparent animate-pulse">
            Built by Akshat Gupta
          </p>
        </div>
      </div>
    </div>
  );
}
