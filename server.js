// backend/server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const User = require("./User");



const app = express();

/* ======== CONFIG ======== */
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

/* ======== DB CONNECT ======== */
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("Mongo connection error:", err));

/* ======== ROUTES ======== */

/**
 * POST /api/auth/check-email
 * body: { email }
 * resp: { exists: boolean }
 */
app.post("/api/auth/check-email", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    return res.json({ exists: !!user });
  } catch (err) {
    console.error("check-email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// At top: already have
// const User = require("./models/User");

// Simple admin route – in real life, protect this with auth/middleware
app.get("/api/admin/users", async (req, res) => {
  try {
    const users = await User.find({}, "name email createdAt").sort({
      createdAt: -1,
    }); // only select safe fields

    res.json({ users });
  } catch (err) {
    console.error("admin users error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * POST /api/auth/register
 * body: { name, email, password }
 */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      passwordPlain: password
    });

    return res.status(201).json({
      message: "User created",
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "No account with that email" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    return res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,   // ⬅ THIS MUST BE HERE
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * POST /api/auth/reset-password
 * body: { email, newPassword }
 */
app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    if (process.env.TEST_MODE === "true") {
      user.passwordPlain = newPassword;
    }
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("reset-password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
