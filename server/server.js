import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";

import userRoutes from "./routes/userRoutes.js";

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api", userRoutes);

// Registration endpoint
app.post("/api/register", async (req, res) => {
  const { name, email, password, country } = req.body;

  // Basic validation
  if (!name || !email || !password || !country) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    await pool.query(
      "INSERT INTO users (name, email, password, country) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, country]
    );

    return res.status(200).json({ success: true, message: "Registration new usersuccessful!" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
});

app.get("/", (req, res) => {
  res.send("Backend server is running alivessssss!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});