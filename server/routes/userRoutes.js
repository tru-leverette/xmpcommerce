import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// Registration route
router.post("/register", async (req, res) => {
  const { name, email, password, country } = req.body;

  if (!name || !email || !password || !country) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    await prisma.user.create({
      data: { name, email, password: hashedPassword, country }
    });

    return res.status(200).json({ success: true, message: "Registration successful!" });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
});

export default router;