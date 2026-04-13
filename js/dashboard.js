import {
  getVault,
  addVault,
  updateVault,
  deleteVault,
  getTrash
} from "./api.js";

/* STATE */
let currentEditId = null;

/* TOAST */
function toast(msg) {
  const t = document.createElement("div");
  t.innerText = msg;
  t.className = "fixed bottom-5 right-5 bg-black text-white p-3 rounded z-50";
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}

/* LOAD DATA */
async function load() {
  const vault = await getVault();
  const trash = await getTrash();

  // Check if elements exist before updating to avoid errors
  if(document.getElementById("total")) document.getElementById("total").textContent = vault.length;
  if(document.getElementById("trashCount")) document.getElementById("trashCount").textContent = trash.length;

  render(vault);
}

/* RENDER TABLE */
function render(data) {
  const table = document.getElementById("table");
  if (!table) return;
  table.innerHTML = "";

  data.forEach(item => {
    table.innerHTML += `
      <tr class="border-t border-gray-800">
        <td class="p-3">${item.site}</td>
        <td class="p-3">${item.username}</td>
        <td class="p-3">
          <span id="pw-${item.id}" data-pw="${item.password}">••••••</span>
          <button onclick="toggle(${item.id})" class="ml-2">👁</button>
          <button onclick="copyPw('${item.password}')" class="ml-2">📋</button>
        </td>
        <td class="p-3">
          <button onclick="openEdit(${item.id})" class="text-blue-400">Edit</button>
          <button onclick="trash(${item.id})" class="text-red-400 ml-2">Delete</button>
        </td>
      </tr>
    `;
  });
}

/* ADD ITEM */
document.getElementById("addBtn").onclick = async () => {
    const siteInput = document.getElementById("site");
    const userInput = document.getElementById("username");
    const passInput = document.getElementById("password");

    await addVault({ 
        site: siteInput.value, 
        username: userInput.value, 
        password: passInput.value 
    });

    toast("Added to Vault");
    siteInput.value = ""; userInput.value = ""; passInput.value = "";
    load();
};

/* --- ATTACHING TO WINDOW FOR HTML ONCLICK ACCESS --- */

// TOGGLE PASSWORD VISIBILITY
window.toggle = (id) => {
  const el = document.getElementById(`pw-${id}`);
  const isHidden = el.innerText === "••••••";
  el.innerText = isHidden ? el.dataset.pw : "••••••";
};

// COPY PASSWORD
window.copyPw = (pw) => {
  navigator.clipboard.writeText(pw);
  toast("Copied to clipboard");
};

// OPEN EDIT MODAL
window.openEdit = (id) => {
  currentEditId = id;
  const modal = document.getElementById("modal");
  if (modal) modal.classList.remove("hidden");
};

// DELETE TO TRASH
window.trash = async (id) => {
  await deleteVault(id);
  toast("Moved to trash");
  load();
};

/* SAVE EDIT LOGIC */
const saveBtn = document.getElementById("saveEdit");
if (saveBtn) {
    saveBtn.onclick = async () => {
      const editUser = document.getElementById("editUser").value;
      const editPass = document.getElementById("editPass").value;

      await updateVault(currentEditId, {
        username: editUser,
        password: editPass
      });

      document.getElementById("modal").classList.add("hidden");
      toast("Updated Vault Item");
      load();
    };
}

/* SEARCH LOGIC */
const searchInput = document.getElementById("search");
if (searchInput) {
    searchInput.oninput = async (e) => {
      const vault = await getVault();
      const filtered = vault.filter(v =>
        v.site.toLowerCase().includes(e.target.value.toLowerCase())
      );
      render(filtered);
    };
}




/* BACKUP TO DATABASE LOGIC */
document.getElementById("backupBtn").onclick = async () => {
    // 1. Get the latest data from the vault (via your api.js function)
    const vault = await getVault();

    if (vault.length === 0) {
        toast("Vault is empty. Nothing to backup.");
        return;
    }

    try {
        // 2. Send the data to your new server endpoint
        const response = await fetch("/api/easypassword/backup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ vaultData: vault })
        });

        if (response.ok) {
            toast("✅ Backup Saved to PostgreSQL");
        } else {
            toast("❌ Backup Failed");
        }
    } catch (error) {
        console.error("Backup network error:", error);
        toast("Network Error: Could not reach server");
    }
};
// Initial Load
load();