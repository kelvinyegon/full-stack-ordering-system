const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");

const app = express();
const JWT_SECRET = "cola_secret_123";

app.use(cors());
app.use(express.json());

pool
  .connect()
  .then(() => console.log("✅ Connected to PostgreSQL"))
  .catch((err) => console.error("❌ DB connection error:", err));

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

function verifyAdminToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

app.post("/api/admin/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM admin_users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const admin = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role || "admin",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        role: admin.role || "admin",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products WHERE is_active = TRUE ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Product fetch error:", err);
    res.status(500).json({ error: "Failed to fetch products" });
  }
});

app.post("/api/orders", async (req, res) => {
  const { customer, items } = req.body;

  if (!customer || !items || items.length === 0) {
    return res.status(400).json({ error: "Customer and items are required" });
  }

  try {
    const total = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const orderResult = await pool.query(
      "INSERT INTO orders (customer, total, status) VALUES ($1, $2, $3) RETURNING *",
      [customer, total, "PAID_DEMO"]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await pool.query(
        "INSERT INTO order_items (order_id, name, price, quantity) VALUES ($1, $2, $3, $4)",
        [order.id, item.name, item.price, item.quantity]
      );
    }

    res.status(201).json({ ...order, items });
  } catch (err) {
    console.error("Order creation error:", err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

app.get(
  "/api/orders",
  verifyAdminToken,
  allowRoles("admin", "staff"),
  async (req, res) => {
    try {
      const ordersResult = await pool.query(
        "SELECT * FROM orders ORDER BY created_at DESC"
      );

      const orders = [];

      for (const order of ordersResult.rows) {
        const itemsResult = await pool.query(
          "SELECT * FROM order_items WHERE order_id = $1",
          [order.id]
        );

        orders.push({ ...order, items: itemsResult.rows });
      }

      res.json(orders);
    } catch (err) {
      console.error("Order fetch error:", err);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  }
);

app.patch(
  "/api/orders/:id/status",
  verifyAdminToken,
  allowRoles("admin", "staff"),
  async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "PAID_DEMO",
      "PREPARING",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    if (status === "CANCELLED" && req.admin.role !== "admin") {
      return res.status(403).json({ error: "Only admins can cancel orders" });
    }

    try {
      const result = await pool.query(
        "UPDATE orders SET status = $1 WHERE id = $2 RETURNING *",
        [status, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Status update error:", err);
      res.status(500).json({ error: "Failed to update order status" });
    }
  }
);

app.get(
  "/api/analytics",
  verifyAdminToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const totalOrders = await pool.query("SELECT COUNT(*) FROM orders");

      const totalRevenue = await pool.query(
        "SELECT COALESCE(SUM(total), 0) AS revenue FROM orders"
      );

      const statusBreakdown = await pool.query(
        "SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status"
      );

      const topProducts = await pool.query(`
        SELECT name, SUM(quantity) AS quantity_sold, SUM(price * quantity) AS revenue
        FROM order_items
        GROUP BY name
        ORDER BY quantity_sold DESC
        LIMIT 5
      `);

      res.json({
        totalOrders: Number(totalOrders.rows[0].count),
        revenue: Number(totalRevenue.rows[0].revenue),
        statusBreakdown: statusBreakdown.rows,
        topProducts: topProducts.rows,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  }
);

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
});