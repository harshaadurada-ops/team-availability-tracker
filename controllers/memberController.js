const pool = require("../config/db");

// GET ALL TEAM MEMBERS
const getMembers = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT * FROM team_members ORDER BY id ASC"
        );

        res.status(200).json({
            success: true,
            total: result.rows.length,
            members: result.rows
        });

    } catch (error) {
        console.error("Get members error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch team members"
        });
    }
};


// UPDATE MEMBER STATUS AND RECORD ACTIVITY
const updateMemberStatus = async (req, res) => {

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Available", "Busy", "Away"];

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid member ID"
        });
    }

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const existingMember = await client.query(
            "SELECT * FROM team_members WHERE id = $1 FOR UPDATE",
            [id]
        );

        if (existingMember.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Team member not found"
            });
        }

        const member = existingMember.rows[0];
        const oldStatus = member.status;

        const updatedMember = await client.query(
            `UPDATE team_members
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [status, id]
        );

        if (oldStatus !== status) {
            await client.query(
                `INSERT INTO activity_logs
                (member_id, member_name, old_status, new_status)
                VALUES ($1, $2, $3, $4)`,
                [id, member.name, oldStatus, status]
            );
        }

        await client.query("COMMIT");

        res.status(200).json({
            success: true,
            message: "Member status updated successfully",
            member: updatedMember.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Status update error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update member status"
        });

    } finally {
        client.release();
    }
};


// EXPORT FUNCTIONS
module.exports = {
    getMembers,
    updateMemberStatus
};