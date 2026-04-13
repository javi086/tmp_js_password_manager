// --------------- Master Password Setup -----------------
function setupMasterPassword() {
  const password = prompt("Create a Master Password for EasyPass:");
  if (!password) return;
  const hash = CryptoJS.SHA256(password).toString();
  chrome.storage.local.set({ masterHash: hash }, () => {
    alert("Master Password set successfully!");
  });
}

// Check if master password exists
// chrome.storage.local.get(["masterHash"], (res) => {
//   if (!res.masterHash) setupMasterPassword();
// });

// --------------- Save Password Popup -----------------
function showSavePopup(username, password, originalForm) {
  const popup = document.createElement("div");

  // High-contrast Dark Mode styling
  popup.className = "fixed top-5 right-5 bg-[#111827] border-2 border-black-600 text-white shadow-2xl p-6 rounded-2xl z-[9999] w-72";

  popup.innerHTML = `
    <div class="text-center">
      <p class="text-lg font-bold mb-1 text-red-400">EasyPass Vault</p>
      <p class="text-sm text-gray-300 mb-4">Save these credentials?</p>
      <div class="flex flex-col gap-2">
        <button id="saveYes" class="bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-lg transition-all">
          Yes, Save to Cloud
        </button>
        <button id="saveNo" class="bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded-lg transition-all">
          No, Thanks
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(popup);

  // NEW Logic: Send credentials to background for saving

 document.getElementById("saveYes").onclick = () => {
  chrome.storage.local.get(["masterHash"], (res) => {
    // 1. If no hash exists, we must set it and WAIT
    if (!res.masterHash) {
      const passwordInput = prompt("Create a Master Password for EasyPass:");
      if (!passwordInput) return;

      const hash = CryptoJS.SHA256(passwordInput).toString();

      // We pass executeCloudBackup as a callback to ensure it waits
      chrome.storage.local.set({ masterHash: hash }, () => {
        alert("Master Password set successfully!");
        executeCloudBackup(username, password, popup);
      });
    } else {
      // 2. If it already exists, proceed immediately
      executeCloudBackup(username, password, popup);
    }
  });
};

  // Helper function to keep your code clean
  async function executeCloudBackup(username, password, popup) {
    const payload = {
      vaultData: [{
        site: window.location.origin,
        username: username,
        password: encrypt(password)
      }]
    };
console.log(payload)
    try {
      const response = await fetch("http://localhost:3000/api/easypassword/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("Success! Credential saved to your EasyPass Cloud Vault.");
      }
    } catch (err) {
      console.error("Cloud Save Error:", err);
      alert("Could not reach the server.");
    }
    popup.remove();
    originalForm.submit();
  }

 document.getElementById("saveNo").onclick = () => {
    popup.remove();
    originalForm.submit(); // Continue to the next page even if they don't save
  };
}

// Detect login form submit
const form = document.querySelector("form");
if (form) {
  form.addEventListener("submit", (e) => {
    // 1. STOP the page from redirecting immediately
    e.preventDefault();

    const username = document.querySelector("input[type='text'], input[type='email']")?.value;
    const password = document.querySelector("input[type='password']")?.value;

    if (!username || !password) {
      form.submit(); // If fields are empty, just let the form go
      return;
    }

    // 2. Show the popup and pass the 'form' so we can submit it later
    showSavePopup(username, password, form);
  });
}

// --------------- Autofill Logic -----------------
window.addEventListener("load", async () => {
  // 1. Check if the page actually has a password field
  const passwordField = document.querySelector("input[type='password']");

  if (!passwordField) {
    console.log("No login fields detected. Staying silent.");
    return; // Exit here so no popups appear on search engines or news sites
  }

  const currentUrl = window.location.origin;

  try {
    // 2. Only if a password field exists, check the cloud database
    const response = await fetch(`http://localhost:3000/api/easypassword/vault/search?url=${currentUrl}`);
    const matches = await response.json();

    if (matches && matches.length > 0) {
      showMasterPasswordPopup(matches[0]);
    }
  } catch (err) {
    console.log("No cloud credentials found for this site.");
  }
});

// Master Password popup for autofill
function showMasterPasswordPopup(data) {
  const popup = document.createElement("div");
  popup.className = "fixed top-5 right-5 bg-gray-800 shadow-xl p-4 rounded-xl z-9999";

  popup.innerHTML = `
    <p class="text-sm font-semibold">Enter Master Password to autofill</p>
    <input type="password" id="masterPass" class="mt-2 border p-1 rounded w-full" placeholder="Master Password"/>
    <button id="unlockPass" class="mt-2 bg-red-500 text-black px-3 py-1 rounded w-full">Unlock</button>
  `;

  document.body.appendChild(popup);

  document.getElementById("unlockPass").onclick = () => {
    const input = document.getElementById("masterPass").value;
    chrome.storage.local.get(["masterHash"], (res) => {
      const inputHash = CryptoJS.SHA256(input).toString();
      if (res.masterHash === inputHash) {
        autofillAndSubmit(data);
        popup.remove();
      } else {
        alert("Incorrect Master Password!");
      }
    });
  };
}

// Add icon inside password field
function addIcon(field) {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";

  field.parentNode.insertBefore(wrapper, field);
  wrapper.appendChild(field);

  const icon = document.createElement("span");
  icon.innerText = "🔐";

  icon.style.position = "absolute";
  icon.style.right = "8px";
  icon.style.top = "50%";
  icon.style.transform = "translateY(-50%)";
  icon.style.cursor = "pointer";

  wrapper.appendChild(icon);

  icon.onclick = () => showPopup(icon);
}

// Show "Fill with EasyPass"
function showPopup(icon) {
  const popup = document.createElement("div");

  popup.innerText = "Fill with EasyPass";
  popup.style.position = "absolute";
  popup.style.top = "30px";
  popup.style.right = "0";
  popup.style.background = "black";
  popup.style.color = "white";
  popup.style.padding = "6px";
  popup.style.borderRadius = "5px";
  popup.style.cursor = "pointer";

  icon.parentElement.appendChild(popup);

  popup.onclick = () => {
    autofill();
    popup.remove();
  };
}

// Autofill logic
function autofill() {
  const domain = window.location.hostname;
  const masterPassword = prompt("Unlock EasyPass");

  if (!masterPassword) return;

  chrome.runtime.sendMessage(
    {
      action: "GET_LOGIN",
      domain,
      masterPassword
    },
    (res) => {
      if (!res || !res.success) return;

      const inputs = document.querySelectorAll("input");

      let user, pass;

      inputs.forEach(i => {
        if (i.type === "text" || i.type === "email") user = i;
        if (i.type === "password") pass = i;
      });

      if (user) user.value = res.data.username;
      if (pass) pass.value = res.data.password;
    }
  );
}

// Initialize
window.onload = () => {
  const passField = document.querySelector("input[type='password']");
  if (passField) addIcon(passField);
};

// Autofill + Auto-submit function
function autofillAndSubmit(data) {
  const usernameInput = document.querySelector("input[type='text'], input[type='email']");
  const passwordInput = document.querySelector("input[type='password']");
  const form = usernameInput.closest("form");

  if (usernameInput && passwordInput && form) {
    usernameInput.value = data.username;
    passwordInput.value = decrypt(data.password);

    // Auto-submit after 200ms
    setTimeout(() => form.submit(), 200);
  }
}
