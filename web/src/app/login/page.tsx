"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hammer, Sparkles, Table2, BarChart3, Code2 } from "lucide-react";
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
    setError(""); setLoading(true);
    try { await login(email, password); router.push("/dashboard"); }
    catch (err) { setError(apiErr(err, "Invalid credentials")); }
    finally { setLoading(false); }
  };

  const demo = async () => {
    setError(""); setLoading(true);
    try { await login("demo@forge.app", "demo12345"); router.push("/dashboard"); }
    catch (err) { setError(apiErr(err, "Demo login failed")); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Hero */}
      <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand via-magenta to-violet text-white shadow-[0_4px_24px_-4px_rgba(236,72,153,0.7)]"><Hammer size={22} /></span>
          <span className="text-xl font-bold font-display text-gradient">Forge</span>
        </div>

        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet/40 bg-violet/10 px-3 py-1 text-xs font-medium text-violet">
            <Sparkles size={13} /> Spreadsheet → full app in seconds
          </div>
          <h2 className="font-display text-5xl font-bold leading-[1.05] tracking-tight">
            Turn any spreadsheet<br />into{" "}
            <span className="text-shimmer">a living web app.</span>
          </h2>
          <p className="mt-5 max-w-md text-lg text-ink-muted">
            Upload a CSV or Excel file and instantly get auth, CRUD, search, auto-charts, a REST API — and ejectable source code.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              { icon: Table2, label: "Smart tables", c: "text-cyan border-cyan/40 bg-cyan/10" },
              { icon: BarChart3, label: "Auto charts", c: "text-magenta border-magenta/40 bg-magenta/10" },
              { icon: Code2, label: "Eject to code", c: "text-indigo border-indigo/40 bg-indigo/10" },
            ].map((f) => (
              <span key={f.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${f.c}`}>
                <f.icon size={13} /> {f.label}
              </span>
            ))}
          </div>
        </div>

        <p className="font-mono text-sm">
          Built by <span className="text-shimmer font-semibold">Akshat Gupta</span>
        </p>
      </div>

      {/* Form */}
      <div className="flex items-center justify-center p-6">
        <div className="glass w-full max-w-sm space-y-6 p-8">
          <div className="lg:hidden mb-2 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand via-magenta to-violet text-white"><Hammer size={20} /></span>
            <span className="text-lg font-bold font-display text-gradient">Forge</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Welcome back</h1>
            <p className="mt-1 text-sm text-ink-muted">Sign in to your account</p>
          </div>
          <ErrorNote message={error} />
          <form onSubmit={submit} className="space-y-4">
            <div><label className="lbl">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="you@example.com" required /></div>
            <div><label className="lbl">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="••••••••" required /></div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Spinner className="h-4 w-4" /> : "Sign in"}</button>
          </form>
          <button onClick={demo} disabled={loading} className="btn-ghost w-full text-xs">✦ Try demo account</button>
          <p className="text-center text-sm text-ink-muted">
            No account?{" "}
            <Link href="/register" className="font-semibold text-violet hover:text-magenta transition-colors">Create one</Link>
          </p>
          <p className="lg:hidden text-center font-mono text-xs">
            Built by <span className="text-gradient font-semibold">Akshat Gupta</span>
          </p>
        </div>
      </div>
    </div>
  );
}
