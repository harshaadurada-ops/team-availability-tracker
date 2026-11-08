const express = require("express");
const path = require("path");
require("dotenv").config();

const memberRoutes = require("./routes/memberRoutes");
const pool = require("./config/db");

const app = express();

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Health check API
app.get("/api/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            success: true,
            message: "Server and database are working!"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database connection failed"
        });
    }
});

// Team member APIs
app.use("/api/members", memberRoutes);

// Start server
app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("TEAM AVAILABILITY TRACKER");
    console.log(`Server running at http://localhost:${PORT}`);
    console.log("--------------------------------");
});