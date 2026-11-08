
const API_URL = "/api/members";

let allMembers = [];

// Fetch all team members from the database
async function fetchMembers() {
    const teamGrid = document.getElementById("teamGrid");

    teamGrid.innerHTML = '<p class="loading-message">Loading team members...</p>';

    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error("Unable to fetch team members");
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to load members");
        }

        allMembers = data.members;

        updateSummary();
        displayMembers(allMembers);

        document.getElementById("memberCount").textContent =
            `${allMembers.length} members`;

        showMessage("");

    } catch (error) {
        console.error("Fetch error:", error);

        teamGrid.innerHTML =
            '<p class="empty-message">Unable to load team members. Please check your server.</p>';

        showMessage("Failed to load team members.", true);
    }
}

// Calculate summary card values
function updateSummary() {
    const total = allMembers.length;

    const available = allMembers.filter(
        member => member.status === "Available"
    ).length;

    const busy = allMembers.filter(
        member => member.status === "Busy"
    ).length;

    const away = allMembers.filter(
        member => member.status === "Away"
    ).length;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("availableCount").textContent = available;
    document.getElementById("busyCount").textContent = busy;
    document.getElementById("awayCount").textContent = away;
}

// Display team members as cards
function displayMembers(members) {
    const teamGrid = document.getElementById("teamGrid");

    if (members.length === 0) {
        teamGrid.innerHTML =
            '<p class="empty-message">No team members found.</p>';

        document.getElementById("memberCount").textContent = "0 members";
        return;
    }

    teamGrid.innerHTML = members.map(member => {
        const initials = member.name
            .split(" ")
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        const statusClass = member.status.toLowerCase();

        return `
            <div class="member-card">
                <div class="member-top">

                    <div class="avatar">${escapeHTML(initials)}</div>

                    <div class="member-info">
                        <h3>${escapeHTML(member.name)}</h3>
                        <p>${escapeHTML(member.role)}</p>
                    </div>

                </div>

                <span class="status-badge status-${statusClass}">
                    ${escapeHTML(member.status)}
                </span>

                <div class="member-details">
                    <p>🌍 Timezone: ${escapeHTML(member.timezone || "Not specified")}</p>

                    <select
                        class="status-select"
                        data-id="${Number(member.id)}"
                        aria-label="Update availability for ${escapeHTML(member.name)}"
                    >
                        <option value="Available" ${member.status === "Available" ? "selected" : ""}>
                            Available
                        </option>

                        <option value="Busy" ${member.status === "Busy" ? "selected" : ""}>
                            Busy
                        </option>

                        <option value="Away" ${member.status === "Away" ? "selected" : ""}>
                            Away
                        </option>
                    </select>
                </div>
            </div>
        `;
    }).join("");

    document.getElementById("memberCount").textContent =
        `${members.length} members`;
}

// Prevent database text from being interpreted as HTML
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

// Search and filter team members
function filterMembers() {
    const searchValue = document
        .getElementById("searchInput")
        .value
        .toLowerCase()
        .trim();

    const selectedRole = document.getElementById("roleFilter").value;
    const selectedStatus = document.getElementById("statusFilter").value;

    const filteredMembers = allMembers.filter(member => {

        const matchesSearch =
            member.name.toLowerCase().includes(searchValue) ||
            member.role.toLowerCase().includes(searchValue);

        const matchesRole =
            selectedRole === "All" || member.role === selectedRole;

        const matchesStatus =
            selectedStatus === "All" || member.status === selectedStatus;

        return matchesSearch && matchesRole && matchesStatus;
    });

    displayMembers(filteredMembers);
}

// Update member availability in PostgreSQL
async function updateStatus(id, newStatus) {
    try {
        showMessage("Updating availability...");

        const response = await fetch(`${API_URL}/${id}/status`, {
            method: "PATCH",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                status: newStatus
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Failed to update status");
        }

        showMessage("Availability updated successfully!");

        // Reload the latest records from the database
        await fetchMembers();

        // Reapply current search and filters
        filterMembers();

    } catch (error) {
        console.error("Update error:", error);

        showMessage(error.message || "Unable to update availability.", true);

        await fetchMembers();
        filterMembers();
    }
}

// Display success or error messages
function showMessage(message, isError = false) {
    const messageElement = document.getElementById("message");

    messageElement.textContent = message;
    messageElement.style.color = isError ? "#dc3545" : "#16834d";
}

// Search input event
document.getElementById("searchInput")
    .addEventListener("input", filterMembers);

// Role filter event
document.getElementById("roleFilter")
    .addEventListener("change", filterMembers);

// Status filter event
document.getElementById("statusFilter")
    .addEventListener("change", filterMembers);

// Update status when dropdown changes
document.getElementById("teamGrid")
    .addEventListener("change", event => {

        if (event.target.classList.contains("status-select")) {
            const id = event.target.dataset.id;
            const newStatus = event.target.value;

            updateStatus(id, newStatus);
        }
    });

// Refresh dashboard
document.getElementById("refreshBtn")
    .addEventListener("click", fetchMembers);

// Load team members when the page opens
fetchMembers();

// =================================
// GLOBAL TEAM TIMEZONE CLOCKS
// =================================

function updateWorldClocks() {

    const locations = [
        {
            timeId: "indiaTime",
            dateId: "indiaDate",
            timezone: "Asia/Kolkata"
        },
        {
            timeId: "londonTime",
            dateId: "londonDate",
            timezone: "Europe/London"
        },
        {
            timeId: "newYorkTime",
            dateId: "newYorkDate",
            timezone: "America/New_York"
        }
    ];

    locations.forEach(location => {

        const now = new Date();

        const time = new Intl.DateTimeFormat("en-US", {
            timeZone: location.timezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true
        }).format(now);

        const date = new Intl.DateTimeFormat("en-US", {
            timeZone: location.timezone,
            weekday: "short",
            day: "2-digit",
            month: "short",
            year: "numeric"
        }).format(now);

        const timeElement = document.getElementById(location.timeId);
        const dateElement = document.getElementById(location.dateId);

        if (timeElement && dateElement) {
            timeElement.textContent = time;
            dateElement.textContent = date;
        }

    });

}

// Display clocks immediately
updateWorldClocks();

// Update every second
setInterval(updateWorldClocks, 1000);
