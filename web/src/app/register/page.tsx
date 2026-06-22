"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Hammer } from "lucide-react";
import { useAuth } from "@/store/auth";
import { apiErr } from "@/lib/api";
import { ErrorNote, Spinner } from "@/components/ui";

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name);
      router.push("/dashboard");
    } catch (err) {
      setError(apiErr(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass w-full max-w-sm space-y-6 p-8">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand via-magenta to-violet text-white shadow-[0_4px_20px_-4px_rgba(219,39,119,0.6)]"><Hammer size={20} /></span>
          <span className="text-lg font-bold font-display text-gradient">Forge</span>
        </div>
        <div>
          <h1 className="text-2xl font-bold font-display">Create account</h1>
          <p className="mt-1 text-sm text-ink-muted">Get started with Forge</p>
        </div>
        <ErrorNote message={error} />
        <form onSubmit={submit} className="space-y-4">
          <div><label className="lbl">Full name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder="Akshat Gupta" /></div>
          <div><label className="lbl">Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" placeholder="you@example.com" required /></div>
          <div><label className="lbl">Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="field" placeholder="At least 6 characters" required minLength={6} /></div>
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Spinner className="h-4 w-4" /> : "Create account"}</button>
        </form>
        <p className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-violet hover:text-magenta transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
