const express = require("express");

const router = express.Router();

const {
    getMembers,
    updateMemberStatus
} = require("../controllers/memberController");

// Get all members
router.get("/", getMembers);

// Update member status
router.patch("/:id/status", updateMemberStatus);

module.exports = router;