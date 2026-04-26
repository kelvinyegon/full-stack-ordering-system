"use client";

import { useEffect, useState } from "react";

type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  id: number;
  customer: string;
  items: OrderItem[];
  total: number;
  status: string;
  created_at: string;
};

type Analytics = {
  totalOrders: number;
  revenue: number;
  statusBreakdown: { status: string; count: string }[];
  topProducts: { name: string; quantity_sold: string; revenue: string }[];
};

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [role, setRole] = useState("");

  function getTokenPayload() {
    const token = localStorage.getItem("adminToken");
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const email = localStorage.getItem("adminEmail");
    const payload = getTokenPayload();

    if (!token || !payload) {
      window.location.href = "/login";
      return;
    }

    setAdminEmail(email || payload.email || "");
    setRole(payload.role || "admin");
  }, []);

  async function loadOrders() {
    try {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        window.location.href = "/login";
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const ordersRes = await fetch("http://localhost:5000/api/orders", {
        headers,
      });

      if (ordersRes.status === 401 || ordersRes.status === 403) {
        logout();
        return;
      }

      const ordersData = await ordersRes.json();
      setOrders(ordersData);

      const analyticsRes = await fetch("http://localhost:5000/api/analytics", {
        headers,
      });

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  async function updateStatus(id: number, status: string) {
    const token = localStorage.getItem("adminToken");

    if (status === "CANCELLED") {
      const confirmCancel = confirm("Are you sure you want to cancel this order?");
      if (!confirmCancel) return;
    }

    await fetch(`http://localhost:5000/api/orders/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    loadOrders();
  }

  function logout() {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    window.location.href = "/login";
  }

  function statusClass(status: string) {
    if (status === "PREPARING") return "bg-yellow-500/20 text-yellow-300 ring-yellow-500/30";
    if (status === "DELIVERED") return "bg-green-500/20 text-green-300 ring-green-500/30";
    if (status === "CANCELLED") return "bg-red-500/20 text-red-300 ring-red-500/30";
    return "bg-blue-500/20 text-blue-300 ring-blue-500/30";
  }

  const isAdmin = role === "admin";
  const isFinal = (status: string) =>
    status === "DELIVERED" || status === "CANCELLED";

  return (
    <main className="min-h-screen overflow-hidden bg-black p-10 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.28),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(127,29,29,0.35),transparent_35%)]" />

      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="animate-[fadeIn_0.6s_ease-out]">
            <p className="mb-3 inline-flex rounded-full bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 ring-1 ring-red-500/30">
              ColaCommerce AI Control Centre
            </p>

            <h1 className="text-5xl font-black tracking-tight text-red-500">
              Admin Dashboard
            </h1>

            <p className="mt-3 text-gray-400">
              Secure role-based order monitoring dashboard.
            </p>

            <div className="mt-4 flex gap-3">
              <span className="rounded-full bg-zinc-900/80 px-4 py-2 text-sm text-gray-300 ring-1 ring-white/10">
                {adminEmail}
              </span>

              <span className="rounded-full bg-red-900/80 px-4 py-2 text-sm font-bold text-red-200 ring-1 ring-red-500/30">
                Role: {role.toUpperCase()}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-red-600 px-6 py-3 font-bold shadow-lg shadow-red-900/40 transition hover:-translate-y-1 hover:bg-red-700 active:scale-95"
          >
            Logout
          </button>
        </div>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ["Total Orders", orders.length],
            ["Revenue", isAdmin ? `KES ${(analytics?.revenue ?? 0).toLocaleString()}` : "Admin only"],
            ["System Status", "Secure"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl bg-zinc-900/80 p-7 ring-1 ring-white/10 backdrop-blur transition duration-300 hover:-translate-y-2 hover:ring-red-500/40 hover:shadow-2xl hover:shadow-red-950/40"
            >
              <p className="text-gray-400">{label}</p>
              <h2 className="mt-3 text-4xl font-black">{value}</h2>
            </div>
          ))}
        </section>

        {!isAdmin && (
          <section className="mt-10 rounded-3xl bg-zinc-900/80 p-7 ring-1 ring-yellow-500/20">
            <h3 className="text-2xl font-black text-yellow-300">Staff Access</h3>
            <p className="mt-2 text-gray-400">
              You can view orders and update order status. Analytics and cancellation are admin-only.
            </p>
          </section>
        )}

        <section className="mt-10 rounded-[2rem] bg-zinc-950/90 p-8 ring-1 ring-white/10">
          <h2 className="text-4xl font-black text-red-500">Orders</h2>

          <div className="mt-6 space-y-5">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-3xl bg-black p-7 ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-red-500/40"
              >
                <div className="flex justify-between gap-6">
                  <div>
                    <h3 className="text-2xl font-black">Order #{order.id}</h3>
                    <p className="mt-2 text-gray-400">Customer: {order.customer}</p>
                    <p className="text-gray-500">
                      {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-2xl font-black text-red-400">
                      KES {order.total.toLocaleString()}
                    </p>
                    <p className={`mt-3 rounded-full px-4 py-2 text-sm font-bold ring-1 ${statusClass(order.status)}`}>
                      {order.status}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    disabled={isFinal(order.status)}
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    className="rounded-xl bg-yellow-600 px-5 py-3 font-bold transition hover:-translate-y-1 hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Preparing
                  </button>

                  <button
                    disabled={isFinal(order.status)}
                    onClick={() => updateStatus(order.id, "DELIVERED")}
                    className="rounded-xl bg-green-600 px-5 py-3 font-bold transition hover:-translate-y-1 hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Delivered
                  </button>

                  {isAdmin && (
                    <button
                      disabled={isFinal(order.status)}
                      onClick={() => updateStatus(order.id, "CANCELLED")}
                      className="rounded-xl bg-red-600 px-5 py-3 font-bold transition hover:-translate-y-1 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <div className="mt-6 border-t border-white/10 pt-4">
                  {order.items.map((item) => (
                    <p key={item.id} className="text-gray-300">
                      {item.name} × {item.quantity} — KES{" "}
                      {item.price.toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}