"use client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login(e:any){
    e.preventDefault();

    const res = await fetch("http://localhost:5000/api/admin/login", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if(!res.ok) return alert(data.error);

    localStorage.setItem("adminToken", data.token);
    localStorage.setItem("adminEmail", data.admin.email);

    window.location.href = "/admin";
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#020617] text-white px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.25),transparent_40%)]"/>

      <form onSubmit={login}
        className="relative w-full max-w-md p-10 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl"
      >
        <h1 className="text-5xl font-black tracking-tight">Sign In</h1>
        <p className="mt-3 text-blue-100">Access your dashboard</p>

        <div className="mt-10 space-y-4">
          <input placeholder="Email"
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 focus:border-blue-500 outline-none"
            onChange={(e)=>setEmail(e.target.value)}
          />

          <input type="password" placeholder="Password"
            className="w-full p-4 rounded-2xl bg-black/40 border border-white/10 focus:border-blue-500 outline-none"
            onChange={(e)=>setPassword(e.target.value)}
          />

          <button className="w-full p-4 rounded-2xl bg-blue-600 font-black transition hover:scale-[1.03] hover:bg-blue-500">
            Continue →
          </button>
        </div>
      </form>
    </main>
  );
}