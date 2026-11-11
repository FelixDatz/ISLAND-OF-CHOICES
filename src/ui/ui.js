// Lapisan UI HTML di atas canvas: prompt, dialog, menu aksi, inventori, notifikasi.
// Modul ini hanya menampilkan. Logika dan penanganan tombol ada di scene.

let hintEl, promptEl, promptLabel, toastBox, dialogEl, dialogText;
let menuEl, menuTitle, menuList, menuButtons = [];
let invEl, invList;
let gameOverEl, gameOverTitle, gameOverText, gameOverRetry;

function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export function mountUi() {
  const root = document.getElementById("ui-root");

  hintEl = el("div", "hud-hint", "Gerak: WASD atau panah\nInteraksi: E, Inventori: I\nDebug: B collision, L log di konsol");
  promptEl = el("div", "ui-prompt");
  promptEl.hidden = true;
  promptEl.append(el("kbd", "", "E"));
  promptLabel = el("span");
  promptEl.append(promptLabel);

  toastBox = el("div", "ui-toasts");

  dialogEl = el("div", "ui-panel ui-dialog");
  dialogEl.hidden = true;
  dialogText = el("p", "ui-dialog-text");
  dialogEl.append(dialogText, el("span", "ui-foot", "E atau klik untuk lanjut"));

  menuEl = el("div", "ui-panel ui-menu");
  menuEl.hidden = true;
  menuTitle = el("h2", "ui-menu-title");
  menuList = el("div", "ui-menu-list");
  menuEl.append(menuTitle, menuList);

  invEl = el("div", "ui-panel ui-inventory");
  invEl.hidden = true;
  invEl.append(el("h2", "ui-menu-title", "Inventori"));
  invList = el("div", "ui-inv-list");
  invEl.append(invList, el("span", "ui-foot", "I atau Esc untuk menutup"));

  gameOverEl = el("div", "ui-panel ui-gameover");
  gameOverTitle = el("h2", "ui-gameover-title");
  gameOverText = el("p", "ui-gameover-text");
  gameOverRetry = el("button", "ui-gameover-retry", "Try Again — mulai dari awal");
  gameOverRetry.type = "button";
  gameOverEl.append(gameOverTitle, gameOverText, gameOverRetry);

  root.append(hintEl, promptEl, toastBox, dialogEl, menuEl, invEl, gameOverEl);
}

export function showPrompt(label) {
  if (!label) {
    promptEl.hidden = true;
    return;
  }
  promptLabel.textContent = label;
  promptEl.hidden = false;
}

export function showDialog(text, onClick) {
  dialogText.textContent = text;
  dialogEl.onclick = onClick;
  dialogEl.hidden = false;
}

export function hideDialog() {
  dialogEl.hidden = true;
  dialogEl.onclick = null;
}

// options: [{ label, enabled }]
export function showMenu(title, options, selected, onPick) {
  menuTitle.textContent = title;
  menuList.replaceChildren();
  menuButtons = options.map((opt, i) => {
    const b = el("button", "ui-option" + (opt.enabled === false ? " is-locked" : ""), opt.label);
    b.type = "button";
    b.tabIndex = -1;
    // Cegah tombol mengambil fokus, supaya Enter/Spasi tidak memicu klik ganda.
    b.addEventListener("mousedown", (e) => e.preventDefault());
    b.addEventListener("click", () => onPick(i));
    menuList.append(b);
    return b;
  });
  setMenuSelected(selected);
  menuEl.hidden = false;
}

export function setMenuSelected(index) {
  menuButtons.forEach((b, i) => b.classList.toggle("is-selected", i === index));
}

export function hideMenu() {
  menuEl.hidden = true;
  menuButtons = [];
}

// items: [{ name, desc, color, count }]
export function showInventory(items) {
  invList.replaceChildren();
  if (items.length === 0) {
    invList.append(el("p", "ui-empty", "Belum ada barang."));
  }
  for (const item of items) {
    const row = el("div", "ui-inv-row");
    const icon = el("span", "ui-inv-icon");
    icon.style.background = item.color;
    const text = el("div", "ui-inv-text");
    text.append(el("strong", "", item.count > 1 ? `${item.name} ×${item.count}` : item.name), el("span", "", item.desc));
    row.append(icon, text);
    invList.append(row);
  }
  invEl.hidden = false;
}

export function hideInventory() {
  invEl.hidden = true;
}

export function toast(text) {
  const t = el("div", "ui-toast", text);
  toastBox.append(t);
  setTimeout(() => t.remove(), 2600);
}


export function showGameOver(title, message, onRetry) {
  gameOverTitle.textContent = title;
  gameOverText.textContent = message;
  gameOverRetry.onclick = onRetry;
  gameOverEl.hidden = false;
}

export function hideGameOver() {
  if (!gameOverEl) return;
  gameOverEl.hidden = true;
  gameOverRetry.onclick = null;
}
