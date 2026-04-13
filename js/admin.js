//const API_URL = "http://localhost:3000/passwords";
//const SETTINGS_URL = "http://localhost:3000/settings";
const API_URL = "/api/easypassword/users"; 
const SETTINGS_URL = "/api/easypassword/settings";

let allUsers = [];
let selectedUserId = null;
let settings = null;

document.addEventListener("DOMContentLoaded", () => {
  loadUsers();
  loadSettings();

  document.getElementById("addUserBtn").addEventListener("click", addUser);
  document.getElementById("suspendUserBtn").addEventListener("click", suspendUser);
  document.getElementById("unsuspendUserBtn").addEventListener("click", unsuspendUser);
  document.getElementById("resetPasswordBtn").addEventListener("click", resetPassword);
  document.getElementById("forceLogoutBtn").addEventListener("click", forceLogout);

  document.getElementById("enableMfaBtn").addEventListener("click", enableMfa);
  document.getElementById("sessionTimeoutBtn").addEventListener("click", setSessionTimeout);
  document.getElementById("manageIpBtn").addEventListener("click", manageIpAccess);
  document.getElementById("updatePolicyBtn").addEventListener("click", updatePasswordPolicy);

  document.getElementById("searchInput").addEventListener("keyup", filterUsers);
});

async function loadUsers() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to load users");

    allUsers = await res.json();
    updateDashboard();
    renderUsers(allUsers);
  } catch (err) {
    console.error(err);
    showAlert("Could not load users.");
  }
}

async function loadSettings() {
  try {
    const res = await fetch(SETTINGS_URL);
    if (!res.ok) throw new Error("Failed to load settings");

    settings = await res.json();
    document.getElementById("failedLogins").textContent = settings.failedLogins ?? 18;
  } catch (err) {
    console.error(err);
    document.getElementById("failedLogins").textContent = 18;
  }
}

function updateDashboard() {
  document.getElementById("totalUsers").textContent = allUsers.length;
  document.getElementById("activeUsers").textContent =
    allUsers.filter(user => user.status === "Active").length;
  document.getElementById("lockedAccounts").textContent =
    allUsers.filter(user => user.status === "Locked").length;
}

function renderUsers(users) {
  const table = document.getElementById("userTableBody");
  table.innerHTML = "";

  users.forEach(user => {
    const row = document.createElement("tr");

    if (user._id === selectedUserId) {
      row.style.backgroundColor = "#330000";
    }

    row.addEventListener("click", () => {
      selectedUserId = user._id;
      renderUsers(users);
      showAlert(`${user.name} selected.`);
    });

    row.innerHTML = `
      <td>${String(user._id).slice(-6)}</td>
      <td>${user.name}</td>
      <td>${user.role}</td>
      <td style="color:${user.status === "Locked" ? "red" : "lime"}">
        ${user.status}
      </td>
      <td>
        <button class="btn" onclick="deleteUser('${user._id}', event)">Delete</button>
      </td>
    `;

    table.appendChild(row);
  });
}

function filterUsers() {
  const searchValue = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allUsers.filter(user =>
    user._id.toLowerCase().includes(searchValue) ||
    user.name.toLowerCase().includes(searchValue) ||
    user.role.toLowerCase().includes(searchValue) ||
    user.status.toLowerCase().includes(searchValue)
  );

  renderUsers(filtered);
}

function showAlert(message) {
  document.getElementById("alertBox").textContent = message;
}


async function addUser() {
  const name = document.getElementById("nameInput").value.trim();
  const role = document.getElementById("roleInput").value.trim();

  if (!name || !role) {
    showAlert("Please enter both user name and role.");
    return;
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role }) // Sending name and role to the server
    });

    if (!res.ok) throw new Error("Failed to add user");

    document.getElementById("nameInput").value = "";
    document.getElementById("roleInput").value = "";

    await loadUsers(); // Refresh the table
    showAlert("New user added! Default password: ChangeMe123!");
  } catch (err) {
    showAlert("Could not add user.");
  }
}


async function updateUser(id, updates, message) {
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Update failed");
    }

    const data = await res.json();
    console.log("Updated user:", data.user);

    selectedUserId = id;
    await loadUsers();
    showAlert(message);
  } catch (err) {
    console.error(err);
    showAlert(err.message || "Update failed.");
  }
}

async function suspendUser() {
  if (!selectedUserId) {
    showAlert("Select a user first.");
    return;
  }

  const user = allUsers.find(u => u._id === selectedUserId);

  if (user && user.status === "Locked") {
    showAlert("User is already suspended.");
    return;
  }

  await updateUser(
    selectedUserId,
    { status: "Locked" },
    "User suspended successfully."
  );
}

async function unsuspendUser() {
  if (!selectedUserId) {
    showAlert("Select a user first.");
    return;
  }

  const user = allUsers.find(u => u._id === selectedUserId);

  if (user && user.status === "Active") {
    showAlert("User is already active.");
    return;
  }

  await updateUser(
    selectedUserId,
    { status: "Active" },
    "User unsuspended successfully."
  );
}

async function resetPassword() {
  if (!selectedUserId) {
    showAlert("Select a user first.");
    return;
  }

  await updateUser(
    selectedUserId,
    { mustResetPassword: true },
    "Password reset flag saved to database."
  );
}

async function forceLogout() {
  if (!selectedUserId) {
    showAlert("Select a user first.");
    return;
  }

  await updateUser(
    selectedUserId,
    { loggedIn: false },
    "User logged out successfully."
  );
}

async function enableMfa() {
  if (!selectedUserId) {
    showAlert("Select a user first.");
    return;
  }

  await updateUser(
    selectedUserId,
    { mfaEnabled: true },
    "MFA enabled successfully."
  );
}

async function setSessionTimeout() {
  const value = prompt("Enter session timeout in minutes:", settings?.sessionTimeout || 15);

  if (!value) return;

  try {
    const res = await fetch(SETTINGS_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sessionTimeout: Number(value) })
    });

    if (!res.ok) throw new Error("Could not update session timeout");

    settings = await res.json();
    showAlert(`Session timeout set to ${settings.sessionTimeout} minutes.`);
  } catch (err) {
    console.error(err);
    showAlert("Could not update session timeout.");
  }
}

async function manageIpAccess() {
  const ip = prompt("Enter IP address to allow:");

  if (!ip) return;

  const rules = settings?.ipAccessRules || [];
  const updatedRules = [...rules, ip];

  try {
    const res = await fetch(SETTINGS_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ipAccessRules: updatedRules })
    });

    if (!res.ok) throw new Error("Could not update IP access");

    settings = await res.json();
    showAlert(`IP rule added: ${ip}`);
  } catch (err) {
    console.error(err);
    showAlert("Could not update IP access.");
  }
}

async function updatePasswordPolicy() {
  const policy = prompt(
    "Enter password policy:",
    settings?.passwordPolicy || "Minimum 8 characters"
  );

  if (!policy) return;

  try {
    const res = await fetch(SETTINGS_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ passwordPolicy: policy })
    });

    if (!res.ok) throw new Error("Could not update password policy");

    settings = await res.json();
    showAlert("Password policy updated successfully.");
  } catch (err) {
    console.error(err);
    showAlert("Could not update password policy.");
  }
}

async function deleteUser(id, event) {
  event.stopPropagation();

  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) throw new Error("Could not delete user");

    if (selectedUserId === id) {
      selectedUserId = null;
    }

    await loadUsers();
    showAlert("User deleted successfully.");
  } catch (err) {
    console.error(err);
    showAlert("Could not delete user.");
  }
}