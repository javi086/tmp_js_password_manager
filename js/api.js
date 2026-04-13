const delay = (ms = 300) => new Promise(r => setTimeout(r, ms));

/* INIT - Only keep Vault and Trash storage */
(function () {
  if (!localStorage.getItem("vault")) {
    localStorage.setItem("vault", JSON.stringify([]));
  }
  if (!localStorage.getItem("trash")) {
    localStorage.setItem("trash", JSON.stringify([]));
  }
})();

/* VAULT FUNCTIONS */
export async function getVault() {
  await delay();
  return JSON.parse(localStorage.getItem("vault"));
}

export async function addVault(item) {
  await delay();
  const vault = JSON.parse(localStorage.getItem("vault"));
  vault.push({ id: Date.now(), ...item });
  localStorage.setItem("vault", JSON.stringify(vault));
}

export async function updateVault(id, data) {
  await delay();
  let vault = JSON.parse(localStorage.getItem("vault"));
  vault = vault.map(v => v.id === id ? { ...v, ...data } : v);
  localStorage.setItem("vault", JSON.stringify(vault));
}

/* DELETE → TRASH */
export async function deleteVault(id) {
  await delay();
  let vault = JSON.parse(localStorage.getItem("vault"));
  let trash = JSON.parse(localStorage.getItem("trash"));
  const item = vault.find(v => v.id === id);
  vault = vault.filter(v => v.id !== id);
  trash.push(item);
  localStorage.setItem("vault", JSON.stringify(vault));
  localStorage.setItem("trash", JSON.stringify(trash));
}

/* TRASH FUNCTIONS */
export async function getTrash() {
  await delay();
  return JSON.parse(localStorage.getItem("trash"));
}