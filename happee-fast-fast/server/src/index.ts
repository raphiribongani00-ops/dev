import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is missing in .env file");
  process.exit(1);
}

const client = new MongoClient(uri);

app.use(cors());
app.use(express.json());

// Helper to connect to DB
async function getDb() {
  await client.connect();
  return client.db("happee-fast-fast");
}

// 1. Get all products
app.get("/api/products", async (req, res) => {
  try {
    const db = await getDb();
    const products = await db.collection("products").find({}).toArray();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// 2. Create a new order
app.post("/api/orders", async (req, res) => {
  try {
    const db = await getDb();
    const order = req.body;
    
    // Add server-side timestamp
    order.createdAt = new Date();
    order.status = "pending"; // default status

    const result = await db.collection("orders").insertOne(order);
    res.status(201).json({ message: "Order placed successfully", orderId: result.insertedId });
  } catch (err) {
    console.error("Failed to save order:", err);
    res.status(500).json({ error: "Failed to save order" });
  }
});

// 3. Get all orders (For Admin Dashboard)
app.get("/api/orders", async (req, res) => {
  try {
    const db = await getDb();
    const orders = await db.collection("orders").find({}).sort({ createdAt: -1 }).toArray();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});