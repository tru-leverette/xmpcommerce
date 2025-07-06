const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Registration endpoint
app.post("/api/register", (req, res) => {
  const { name, email, password, country } = req.body;

  // Basic validation
  if (!name || !email || !password || !country) {
    return res.status(400).json({ error: "All fields are required." });
  }

  // TODO: Add logic to check if user exists, hash password, and save to database

  // For demonstration, just return success
  return res.status(200).json({ success: true, message: "Registration successful!" });
});

app.get("/", (req, res) => {
  res.send("Backend server is running alivessssss!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});