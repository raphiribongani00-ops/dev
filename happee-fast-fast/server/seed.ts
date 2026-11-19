import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is missing");
  process.exit(1);
}

const client = new MongoClient(uri);

const products = [
  {
    name: "White Bread",
    price: 18.50,
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=200&q=80&fit=crop"
  },
  {
    name: "Full Cream Milk 2L",
    price: 34.99,
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&q=80&fit=crop"
  },
  {
    name: "Large Eggs (6)",
    price: 24.00,
    category: "Groceries",
    image: "https://images.unsplash.com/photo-1587486913049-53fc88980cfc?w=200&q=80&fit=crop"
  },
  {
    name: "Cheese Burger",
    price: 65.00,
    category: "Takeaways",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80&fit=crop"
  },
  {
    name: "Coca-Cola 2L",
    price: 22.00,
    category: "Essentials",
    image: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=200&q=80&fit=crop"
  }
];

async function seedDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    
    const db = client.db("happee-fast-fast");
    const collection = db.collection("products");

    // Clear existing products to avoid duplicates
    await collection.deleteMany({});
    
    // Insert new products
    const result = await collection.insertMany(products);
    console.log(`Successfully inserted ${result.insertedCount} products!`);
    
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await client.close();
  }
}

seedDatabase();