const canvas = document.getElementById("rouletteCanvas");
const ctx = canvas.getContext("2d");

const itemsInput = document.getElementById("itemsInput");
const applyButton = document.getElementById("applyButton");
const saveButton = document.getElementById("saveButton");
const clearButton = document.getElementById("clearButton");
const spinButton = document.getElementById("spinButton");
const resultText = document.getElementById("resultText");
const message = document.getElementById("message");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");

const ITEMS_STORAGE_KEY = "roulette-picker-items";
const HISTORY_STORAGE_KEY = "roulette-picker-history";

const defaultItems = ["ラーメン", "カレー", "うどん", "ハンバーガー", "寿司", "パスタ"];

const colors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16"
];

let items = [];
let currentRotation = 0;
let isSpinning = false;

function showMessage(text, type = "normal") {
  message.textContent = text;

  if (type === "error") {
    message.style.color = "#dc2626";
  } else if (type === "success") {
    message.style.color = "#15803d";
  } else {
    message.style.color = "#2563eb";
  }
}

function splitItems(text) {
  return text
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

function removeDuplicates(array) {
  return [...new Set(array)];
}

function applyItems() {
  const inputItems = removeDuplicates(splitItems(itemsInput.value));

  if (inputItems.length < 2) {
    showMessage("項目は2つ以上入力してください。", "error");
    return;
  }

  items = inputItems;
  drawRoulette();
  resultText.textContent = "結果：---";
  showMessage(`${items.length}件の項目を反映しました。`, "success");
}

function saveItems() {
  const inputItems = removeDuplicates(splitItems(itemsInput.value));

  if (inputItems.length < 2) {
    showMessage("保存するには項目を2つ以上入力してください。", "error");
    return;
  }

  localStorage.setItem(ITEMS_STORAGE_KEY, inputItems.join("\n"));
  showMessage("項目を保存しました。", "success");
}

function loadItems() {
  const saved = localStorage.getItem(ITEMS_STORAGE_KEY);

  if (saved) {
    itemsInput.value = saved;
  } else {
    itemsInput.value = defaultItems.join("\n");
  }

  items = removeDuplicates(splitItems(itemsInput.value));
  drawRoulette();
}

function clearItems() {
  const ok = confirm("入力内容と保存済み項目を削除しますか？");

  if (!ok) {
    return;
  }

  localStorage.removeItem(ITEMS_STORAGE_KEY);
  itemsInput.value = "";
  items = [];
  drawRoulette();
  resultText.textContent = "結果：---";
  showMessage("項目をクリアしました。", "success");
}

function drawRoulette() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = canvas.width / 2 - 12;

  if (items.length === 0) {
    drawEmptyWheel(centerX, centerY, radius);
    return;
  }

  const sliceAngle = (Math.PI * 2) / items.length;

  items.forEach((item, index) => {
    const startAngle = index * sliceAngle - Math.PI / 2;
    const endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();

    drawTextOnSlice(item, index, sliceAngle, centerX, centerY, radius);
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 15px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("START", centerX, centerY);
}

function drawEmptyWheel(centerX, centerY, radius) {
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = "#e2e8f0";
  ctx.fill();

  ctx.fillStyle = "#64748b";
  ctx.font = "bold 20px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("項目を入力してください", centerX, centerY);
}

function drawTextOnSlice(item, index, sliceAngle, centerX, centerY, radius) {
  const angle = index * sliceAngle + sliceAngle / 2 - Math.PI / 2;
  const textRadius = radius * 0.66;
  const x = centerX + Math.cos(angle) * textRadius;
  const y = centerY + Math.sin(angle) * textRadius;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle + Math.PI / 2);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 15px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 4;

  const displayText = item.length > 8 ? item.slice(0, 8) + "…" : item;
  ctx.fillText(displayText, 0, 0);

  ctx.restore();
}

function secureRandomInt(max) {
  const randomArray = new Uint32Array(1);
  const maxUint32 = 0x100000000;
  const limit = Math.floor(maxUint32 / max) * max;

  let randomValue;

  do {
    crypto.getRandomValues(randomArray);
    randomValue = randomArray[0];
  } while (randomValue >= limit);

  return randomValue % max;
}

function spinRoulette() {
  if (isSpinning) {
    return;
  }

  if (items.length < 2) {
    showMessage("項目を2つ以上入力してから回してください。", "error");
    return;
  }

  isSpinning = true;
  spinButton.disabled = true;
  resultText.textContent = "抽選中...";
  showMessage("ルーレットを回しています。", "normal");

  const selectedIndex = secureRandomInt(items.length);
  const selectedItem = items[selectedIndex];

  const sliceAngleDeg = 360 / items.length;
  const selectedCenterDeg = selectedIndex * sliceAngleDeg + sliceAngleDeg / 2;

  const extraSpins = 5 + secureRandomInt(4);
  const targetRotation = 360 - selectedCenterDeg;
  const finalRotation = extraSpins * 360 + targetRotation;

  currentRotation += finalRotation;

  canvas.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    isSpinning = false;
    spinButton.disabled = false;

    resultText.textContent = `結果：${selectedItem}`;
    showMessage(`「${selectedItem}」が選ばれました。`, "success");

    addHistory(selectedItem);
    renderHistory();
  }, 4200);
}

function getHistory() {
  const saved = localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!saved) {
    return [];
  }

  try {
    return JSON.parse(saved);
  } catch {
    return [];
  }
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function addHistory(result) {
  const history = getHistory();

  history.unshift({
    result: result,
    date: new Date().toLocaleString("ja-JP")
  });

  saveHistory(history.slice(0, 10));
}

function renderHistory() {
  const history = getHistory();
  historyList.innerHTML = "";

  if (history.length === 0) {
    const li = document.createElement("li");
    li.textContent = "まだ履歴はありません。";
    historyList.appendChild(li);
    return;
  }

  history.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = `${item.result} - ${item.date}`;
    historyList.appendChild(li);
  });
}

function clearHistory() {
  const ok = confirm("履歴を削除しますか？");

  if (!ok) {
    return;
  }

  localStorage.removeItem(HISTORY_STORAGE_KEY);
  renderHistory();
  showMessage("履歴を削除しました。", "success");
}

applyButton.addEventListener("click", applyItems);
saveButton.addEventListener("click", saveItems);
clearButton.addEventListener("click", clearItems);
spinButton.addEventListener("click", spinRoulette);
clearHistoryButton.addEventListener("click", clearHistory);

loadItems();
renderHistory();
