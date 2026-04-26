"use client";

import { useState } from "react";

export default function Home() {
  const [customer] = useState("Alex");
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const products = [
    { id: 1, name: "Classic Cola", price: 120 },
    { id: 2, name: "Orange Soda", price: 150 },
    { id: 3, name: "Energy Drink", price: 200 },
  ];

  function addToCart(product: any) {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) =>
          p.id === product.id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  }

  async function placeOrder() {
    if (cart.length === 0) {
      alert("Cart is empty!");
      return;
    }

    setLoading(true);

    await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer,
        items: cart,
      }),
    });

    setLoading(false);
    alert("✅ Order placed successfully!");
    setCart([]);
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-black text-white px-6 py-10">

      {/* HEADER */}
      <div className="mb-12">
        <h1 className="text-6xl font-black bg-gradient-to-r from-yellow-400 to-blue-500 bg-clip-text text-transparent">
          ColaCommerce
        </h1>
        <p className="text-gray-400 mt-2">
          Order drinks instantly. Fast. Simple. Powerful.
        </p>
      </div>

      {/* PRODUCTS */}
      <div className="grid md:grid-cols-3 gap-8">
        {products.map((p) => (
          <div
            key={p.id}
            className="bg-zinc-900/80 backdrop-blur p-6 rounded-3xl border border-white/10 
                       hover:border-yellow-400 transition-all duration-300 hover:-translate-y-2"
          >
            <h2 className="text-2xl font-bold">{p.name}</h2>
            <p className="text-gray-400 mt-1">KES {p.price}</p>

            <button
              onClick={() => addToCart(p)}
              className="mt-6 w-full bg-gradient-to-r from-yellow-400 to-blue-500 
                         text-black font-bold py-3 rounded-xl 
                         hover:scale-105 transition"
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* CART */}
      <div className="mt-14 bg-zinc-900/80 p-8 rounded-3xl border border-white/10">
        <h2 className="text-3xl font-black mb-6">Your Cart</h2>

        {cart.length === 0 ? (
          <p className="text-gray-500">No items added yet</p>
        ) : (
          <>
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b border-white/10 py-3"
              >
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>KES {item.price * item.quantity}</span>
              </div>
            ))}

            {/* TOTAL */}
            <div className="flex justify-between mt-6 text-xl font-bold">
              <span>Total</span>
              <span>KES {total}</span>
            </div>
          </>
        )}

        <button
          onClick={placeOrder}
          disabled={loading}
          className="mt-8 w-full bg-blue-500 py-4 rounded-xl font-bold 
                     hover:bg-blue-400 transition hover:scale-105 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </div>
    </main>
  );
}