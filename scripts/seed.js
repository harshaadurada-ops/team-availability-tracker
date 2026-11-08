const fs = require("fs");
const path = require("path");
const pool = require("../config/db");

async function seedDatabase() {
    let client;

    try {
        // Step 1: Read the JSON dataset
        const filePath = path.join(
            __dirname,
            "../data/team_availability_seed.json"
        );

        const rawData = fs.readFileSync(filePath, "utf8");
        const members = JSON.parse(rawData);

        if (!Array.isArray(members)) {
            throw new Error("Dataset must contain a JSON array.");
        }

        console.log("Dataset loaded successfully.");
        console.log("Total records found:", members.length);

        // Step 2: Validate member information
        const allowedStatuses = ["Available", "Busy", "Away"];

        for (const member of members) {
            if (
                !Number.isInteger(member.id) ||
                !member.name ||
                !member.role ||
                !allowedStatuses.includes(member.status)
            ) {
                throw new Error(
                    `Invalid data for member ID: ${member.id}`
                );
            }
        }

        // Step 3: Connect to PostgreSQL
        client = await pool.connect();

        await client.query("BEGIN");

        // Step 4: Insert records into the database
        for (const member of members) {
            await client.query(
                `INSERT INTO team_members
                (id, name, role, status, timezone)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id)
                DO UPDATE SET
                    name = EXCLUDED.name,
                    role = EXCLUDED.role,
                    status = EXCLUDED.status,
                    timezone = EXCLUDED.timezone,
                    updated_at = CURRENT_TIMESTAMP`,
                [
                    member.id,
                    member.name,
                    member.role,
                    member.status,
                    member.timezone || null
                ]
            );
        }

        // Step 5: Save changes
        await client.query("COMMIT");

        console.log("--------------------------------");
        console.log("DATABASE SEEDED SUCCESSFULLY!");
        console.log("Total records processed:", members.length);
        console.log("--------------------------------");

    } catch (error) {
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback failed:", rollbackError.message);
            }
        }

        console.error("SEEDING FAILED!");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Full error:", error);
        console.error("Error stack:", error.stack);

    } finally {
        if (client) {
            client.release();
        }

        await pool.end();
    }
}

seedDatabase();