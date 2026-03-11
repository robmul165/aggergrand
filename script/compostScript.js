// script/compostScript.js

// State to track calculator slots - using 'let' to allow dynamic growth
let calcState = [
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 }
];
let compostData = [];

document.addEventListener("DOMContentLoaded", () => {
  renderCalcRows();
  
  // Attach Event Listeners
  document.getElementById("addIngredientBtn").addEventListener("click", addEmptyRow);
  document.getElementById("calculateBtn").addEventListener("click", calculateRatio);
  document.getElementById("resetBtn").addEventListener("click", resetCalculator);
  initializeQuickAdd();

  if (window.location.protocol === "file:") {
    displayLoadError(new Error("The compost table requires a local web server."));
    return;
  }

  const brownsUrl = new URL("data/compostBrowns.json", window.location.href);
  const greensUrl = new URL("data/compostGreens.json", window.location.href);

  Promise.all([
    fetch(brownsUrl).then(r => r.ok ? r.json() : Promise.reject(`Failed to load Browns: ${r.status}`)),
    fetch(greensUrl).then(r => r.ok ? r.json() : Promise.reject(`Failed to load Greens: ${r.status}`))
  ])
    .then(([browns, greens]) => {
      compostData = [...browns, ...greens]; 
      buildTable(compostData);
      renderSearchResults("");
    })
    .catch(displayLoadError);
});

/* ================= CALCULATOR LOGIC ================= */

function addEmptyRow() {
    calcState.push({ name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 });
    renderCalcRows();
}

function addToCalculator(item) {
    let index = calcState.findIndex(s => s.name === "");
    
    const ingredientData = {
        name: item.name || "Unknown",
        weight: 10, 
        moisture: item.moisture_percent || 0,
        nitrogen: item.Nitrogen_Percent || 0,
        carbon: item.Carbon_Percent || 0
    };

    if (index === -1) {
        calcState.push(ingredientData);
    } else {
        calcState[index] = ingredientData;
    }

    renderCalcRows();
    calculateRatio(); 
}

function renderCalcRows() {
    const tbody = document.getElementById("calcBody");
    tbody.innerHTML = "";
    calcState.forEach((row, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="text" value="${row.name}" onchange="updateState(${i}, 'name', this.value)"></td>
            <td><input type="number" value="${row.weight || ''}" onchange="updateState(${i}, 'weight', this.value)"></td>
            <td><input type="number" value="${row.moisture || ''}" onchange="updateState(${i}, 'moisture', this.value)"></td>
            <td><input type="number" step="0.01" value="${row.nitrogen || ''}" onchange="updateState(${i}, 'nitrogen', this.value)"></td>
            <td><input type="number" value="${row.carbon || ''}" onchange="updateState(${i}, 'carbon', this.value)"></td>
            <td><button type="button" onclick="clearRow(${i})" style="color:red; background:none; border:none; cursor:pointer; font-weight:bold;">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}

window.updateState = function(index, field, value) {
    calcState[index][field] = field === 'name' ? value : parseFloat(value);
};

window.clearRow = function(index) {
    if (calcState.length > 3) {
        calcState.splice(index, 1);
    } else {
        calcState[index] = { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 };
    }
    renderCalcRows();
    calculateRatio();
};

window.resetCalculator = function() {
    calcState = [
        { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
        { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
        { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 }
    ];
    renderCalcRows();
    document.getElementById("totalRatio").value = "";
};

window.calculateRatio = function() {
    let totalC = 0; 
    let totalN = 0;
    calcState.forEach(row => {
        const dryFactor = (100 - (row.moisture || 0)); 
        totalC += (row.weight || 0) * dryFactor * (row.carbon || 0);
        totalN += (row.weight || 0) * dryFactor * (row.nitrogen || 0);
    });
    const resultBox = document.getElementById("totalRatio");
    if (!resultBox) return;
    if (totalN === 0) {
        resultBox.value = totalC > 0 ? "Infinite" : "0";
        return;
    }
    resultBox.value = `${(totalC / totalN).toFixed(1)} : 1`;
};

/* ================= TABLE & SEARCH LOGIC ================= */

function buildTable(data) {
  const tbody = document.querySelector("#compostTable tbody");
  tbody.innerHTML = ""; 
  data.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.className = item.category ? item.category.toLowerCase() : ""; 
    tr.innerHTML = `
      <td><button class="btn btn-select" data-index="${index}">Select</button></td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.cn_ratio}:1</td>
      <td>${item.decomposition_days} days</td>
      <td>${item.notes || ""}</td>`;
    tbody.appendChild(tr);
  });

  document.querySelectorAll(".btn-select").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const itemIndex = Number(e.currentTarget.getAttribute("data-index"));
      const itemData = compostData[itemIndex];
      if (itemData) {
        addToCalculator(itemData);
        scrollToCalculator();
      }
    });
  });
  addSortHandlers();
}

function initializeQuickAdd() {
  const searchInput = document.getElementById("materialSearch");
  const addTopMatchBtn = document.getElementById("addSearchMatchBtn");
  searchInput.addEventListener("input", () => renderSearchResults(searchInput.value));
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); addFirstSearchMatch(); }
  });
  addTopMatchBtn.addEventListener("click", addFirstSearchMatch);
}

function renderSearchResults(query) {
  const searchStatus = document.getElementById("searchStatus");
  const searchResults = document.getElementById("searchResults");
  const trimmedQuery = query.trim();
  searchResults.innerHTML = "";
  if (!compostData.length) return;
  if (!trimmedQuery) { searchStatus.textContent = "Search for materials..."; return; }
  const matches = getSearchMatches(trimmedQuery);
  if (!matches.length) { searchStatus.textContent = "No matches."; return; }
  searchStatus.textContent = `Found ${matches.length} results.`;
  matches.forEach(match => searchResults.appendChild(createSearchResultCard(match)));
}

function getSearchMatches(query) {
  const q = query.toLowerCase();
  return compostData
    .map((item, index) => ({ item, index, score: getSearchScore(item, q) }))
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function getSearchScore(item, query) {
  const name = (item.name || "").toLowerCase();
  let score = 0;
  if (name === query) score += 100;
  if (name.includes(query)) score += 50;
  return score;
}

function createSearchResultCard(match) {
  const { item, index } = match;
  const card = document.createElement("div");
  card.className = "quick-add-card";
  card.innerHTML = `
    <div class="quick-add-copy">
        <strong>${item.name}</strong>
        <div class="quick-add-meta">
            <span class="category-pill ${item.category.toLowerCase()}">${item.category}</span>
            <span>C:N ${item.cn_ratio}:1</span>
        </div>
    </div>
    <button type="button" class="btn btn-quick-add" onclick="addMaterialByIndex(${index})">Add</button>
  `;
  return card;
}

window.addMaterialByIndex = function(index) {
  const item = compostData[index];
  if (item) {
    addToCalculator(item);
    scrollToCalculator();
  }
};

function addFirstSearchMatch() {
  const query = document.getElementById("materialSearch").value;
  const matches = getSearchMatches(query);
  if (matches.length > 0) addMaterialByIndex(matches[0].index);
}

function addSortHandlers() {
  document.querySelectorAll("#compostTable th").forEach((th, index) => {
    if (index === 0) return; 
    th.addEventListener("click", () => {
      const rows = [...document.querySelectorAll("#compostTable tbody tr")];
      const asc = th.classList.toggle("asc");
      rows.sort((a, b) => {
        const va = a.children[index].textContent.trim().toLowerCase();
        const vb = b.children[index].textContent.trim().toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
      const tbody = document.querySelector("#compostTable tbody");
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

function scrollToCalculator() {
    const calc = document.querySelector(".calc-container");
    if (calc) calc.scrollIntoView({ behavior: "smooth" });
}

function displayLoadError(err) {
  console.error("Data load error:", err);
  const tbody = document.querySelector("#compostTable tbody");
  tbody.innerHTML = `<tr><td colspan="6">Error loading data. Check console.</td></tr>`;
}