// script/compostScript.js

// State to track calculator slots
const calcState = [
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 }
];
let compostData = [];

document.addEventListener("DOMContentLoaded", () => {
  renderCalcRows();
  document.getElementById("calculateBtn").addEventListener("click", calculateRatio);
  document.getElementById("resetBtn").addEventListener("click", resetCalculator);
  initializeQuickAdd();

  if (window.location.protocol === "file:") {
    displayLoadError(new Error("The compost table requires a local web server."));
    return;
  }

  // Define paths for your new split files
  const brownsUrl = new URL("data/compostBrowns.json", window.location.href);
  const greensUrl = new URL("data/compostGreens.json", window.location.href);

  // Use Promise.all to fetch both files at once
  Promise.all([
    fetch(brownsUrl).then(r => r.ok ? r.json() : Promise.reject(`Failed to load Browns: ${r.status}`)),
    fetch(greensUrl).then(r => r.ok ? r.json() : Promise.reject(`Failed to load Greens: ${r.status}`))
  ])
    .then(([browns, greens]) => {
      // Merge them into one master array for the UI to use
      compostData = [...browns, ...greens]; 
      
      buildTable(compostData);
      renderSearchResults("");
    })
    .catch(displayLoadError);
});

/* ================= TABLE LOGIC ================= */

function buildTable(data) {
  const tbody = document.querySelector("#compostTable tbody");
  tbody.innerHTML = ""; // Clear existing

  data.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.className = item.category ? item.category.toLowerCase() : ""; 

    tr.innerHTML = `
      <td><button class="btn btn-select" data-index="${index}">Select</button></td>
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.cn_ratio}</td>
      <td>${item.decomposition}</td>
      <td>${item.notes}</td>`;
    
    tbody.appendChild(tr);
  });

  // Attach listeners to all new select buttons
  document.querySelectorAll(".btn-select").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const itemIndex = Number(e.currentTarget.getAttribute("data-index"));
      const itemData = compostData[itemIndex];

      if (!itemData) {
        return;
      }

      addToCalculator(itemData);
      scrollToCalculator();
    });
  });

  addSortHandlers();
}

function displayLoadError(err) {
  console.error("Data load error:", err);

  const tbody = document.querySelector("#compostTable tbody");
  tbody.innerHTML = `
    <tr>
      <td colspan="6">
        Unable to load compost data. Open this page through a local web server instead of
        opening the HTML file directly, then visit http://localhost:3000/compostTable.html.
      </td>
    </tr>`;

  const searchStatus = document.getElementById("searchStatus");
  const searchResults = document.getElementById("searchResults");

  if (searchStatus) {
    searchStatus.textContent = "The quick-add search is unavailable until the compost data loads.";
  }

  if (searchResults) {
    searchResults.innerHTML = "";
  }
}

function addSortHandlers() {
  document.querySelectorAll("#compostTable th").forEach((th, index) => {
    // Skip the "Add" button column (index 0)
    if (index === 0) return; 

    th.addEventListener("click", () => {
      const rows = [...document.querySelectorAll("#compostTable tbody tr")];
      const asc = th.classList.toggle("asc");
      th.classList.toggle("desc", !asc);
      
      document.querySelectorAll("#compostTable th")
              .forEach(h => h !== th && h.classList.remove("asc", "desc"));

      rows.sort((a, b) => {
        // Adjust index for data columns (since we added a button column at 0)
        const va = a.children[index].textContent.trim().toLowerCase();
        const vb = b.children[index].textContent.trim().toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
      
      const tbody = document.querySelector("#compostTable tbody");
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

function initializeQuickAdd() {
  const searchInput = document.getElementById("materialSearch");
  const addTopMatchBtn = document.getElementById("addSearchMatchBtn");

  searchInput.addEventListener("input", () => {
    renderSearchResults(searchInput.value);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addFirstSearchMatch();
  });

  addTopMatchBtn.addEventListener("click", addFirstSearchMatch);
}

function renderSearchResults(query) {
  const searchStatus = document.getElementById("searchStatus");
  const searchResults = document.getElementById("searchResults");
  const trimmedQuery = query.trim();

  searchResults.innerHTML = "";

  if (!compostData.length) {
    searchStatus.textContent = "Loading compost materials...";
    return;
  }

  if (!trimmedQuery) {
    searchStatus.textContent = "Start typing to search brown and green materials.";
    return;
  }

  const matches = getSearchMatches(trimmedQuery);

  if (!matches.length) {
    searchStatus.textContent = `No matches found for "${trimmedQuery}".`;
    return;
  }

  searchStatus.textContent = `Showing ${matches.length} match${matches.length === 1 ? "" : "es"} for "${trimmedQuery}". Press Enter to add the top result.`;

  matches.forEach(match => {
    searchResults.appendChild(createSearchResultCard(match));
  });
}

function getSearchMatches(query) {
  const normalizedQuery = query.trim().toLowerCase();

  return compostData
    .map((item, index) => ({ item, index, score: getSearchScore(item, normalizedQuery) }))
    .filter(entry => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, 6);
}

function getSearchScore(item, query) {
  const name = (item.name || "").toLowerCase();
  const category = (item.category || "").toLowerCase();
  const notes = (item.notes || "").toLowerCase();

  let score = 0;

  if (name === query) score += 120;
  if (name.startsWith(query)) score += 80;
  if (name.includes(query)) score += 45;
  if (category.includes(query)) score += 20;
  if (notes.includes(query)) score += 10;

  return score;
}

function createSearchResultCard(match) {
  const { item, index } = match;
  const card = document.createElement("div");
  card.className = "quick-add-card";

  const copy = document.createElement("div");
  copy.className = "quick-add-copy";

  const title = document.createElement("strong");
  title.textContent = item.name;
  copy.appendChild(title);

  const meta = document.createElement("div");
  meta.className = "quick-add-meta";

  const categoryPill = document.createElement("span");
  categoryPill.className = `category-pill ${(item.category || "").toLowerCase()}`;
  categoryPill.textContent = item.category || "Uncategorized";
  meta.appendChild(categoryPill);

  const ratioText = document.createElement("span");
  ratioText.textContent = ` C:N ${item.cn_ratio || "N/A"}`;
  meta.appendChild(ratioText);

  copy.appendChild(meta);

  if (item.notes) {
    const notes = document.createElement("div");
    notes.className = "quick-add-meta";
    notes.textContent = item.notes;
    copy.appendChild(notes);
  }

  const addButton = document.createElement("button");
  addButton.type = "button";
  addButton.className = "btn btn-quick-add";
  addButton.textContent = "Add";
  addButton.addEventListener("click", () => {
    addMaterialByIndex(index);
  });

  card.appendChild(copy);
  card.appendChild(addButton);

  return card;
}

function addFirstSearchMatch() {
  const searchInput = document.getElementById("materialSearch");
  const trimmedQuery = searchInput.value.trim();

  if (!trimmedQuery) {
    renderSearchResults("");
    return;
  }

  const [topMatch] = getSearchMatches(trimmedQuery);

  if (!topMatch) {
    renderSearchResults(trimmedQuery);
    return;
  }

  addMaterialByIndex(topMatch.index);
}

function addMaterialByIndex(index) {
  const item = compostData[index];

  if (!item) {
    return;
  }

  addToCalculator(item);
  scrollToCalculator();

  const searchInput = document.getElementById("materialSearch");
  const searchStatus = document.getElementById("searchStatus");
  const searchResults = document.getElementById("searchResults");

  searchInput.value = "";
  searchResults.innerHTML = "";
  searchStatus.textContent = `${item.name} added to the calculator.`;
}

/* ================= CALCULATOR LOGIC ================= */

function addToCalculator(item) {
    console.log("Adding item:", item); // Debugging line

    // Find first empty slot or overwrite the last one if full
    let index = calcState.findIndex(s => s.name === "");
    if (index === -1) index = 2; 

    // Match these exactly to your new JSON keys
    const nPercent = item.Nitrogen_Percent || 0;
    const cPercent = item.Carbon_Percent || 0;
    const moisture = item.moisture_percent || 0;
    
    calcState[index] = {
        name: item.name || "Unknown",
        weight: 10, 
        moisture: moisture,
        nitrogen: nPercent,
        carbon: cPercent
    };

    renderCalcRows();
    calculateRatio(); 
}

    // Parse specific fields from JSON
    const nPercent = parseNum(item["N%"]);
    const moisture = parseNum(item["moistureContent%"]);
    
    // Attempt to calculate Carbon %
    // Logic: If we have C:N ratio (e.g., 30) and N% (e.g., 1%), then C% = 30 * 1 = 30%
    let cPercent = 0;
    const ratioRaw = item.cn_ratio ? item.cn_ratio.split(":")[0] : "0";
    const ratio = parseNum(ratioRaw);

    if (nPercent > 0 && ratio > 0) {
        cPercent = (nPercent * ratio).toFixed(2);
    }

    // Update State
    calcState[index] = {
        name: item.name,
        weight: 10, // Default weight to prompt user
        moisture: moisture,
        nitrogen: nPercent,
        carbon: cPercent
    };

    renderCalcRows();
    calculateRatio(); // Auto calc on add


function scrollToCalculator() {
    document.querySelector(".calc-container").scrollIntoView({ behavior: "smooth" });
}

function renderCalcRows() {
    const tbody = document.getElementById("calcBody");
    tbody.innerHTML = "";

    calcState.forEach((row, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><input type="text" placeholder="Ingredient ${i+1}" value="${row.name}" onchange="updateState(${i}, 'name', this.value)"></td>
            <td><input type="number" step="0.1" placeholder="0" value="${row.weight || ''}" onchange="updateState(${i}, 'weight', this.value)"></td>
            <td><input type="number" step="0.1" placeholder="0" value="${row.moisture || ''}" onchange="updateState(${i}, 'moisture', this.value)"></td>
            <td><input type="number" step="0.01" placeholder="0" value="${row.nitrogen || ''}" onchange="updateState(${i}, 'nitrogen', this.value)"></td>
            <td><input type="number" step="0.1" placeholder="0" value="${row.carbon || ''}" onchange="updateState(${i}, 'carbon', this.value)"></td>
            <td><button type="button" onclick="clearRow(${i})" style="color:red; background:none; border:none; cursor:pointer;">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Expose these functions to window so HTML onchange attributes can see them
window.updateState = function(index, field, value) {
    calcState[index][field] = field === 'name' ? value : parseFloat(value);
};

window.clearRow = function(index) {
    calcState[index] = { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 };
    renderCalcRows();
    calculateRatio();
};

window.resetCalculator = function() {
    calcState.forEach((_, i) => window.clearRow(i));
    document.getElementById("totalRatio").value = "";
};

window.calculateRatio = function() {
    let totalCarbonMass = 0;
    let totalNitrogenMass = 0;

    calcState.forEach(row => {
        const weight = row.weight || 0;
        const moisture = row.moisture || 0;
        const C = row.carbon || 0;
        const N = row.nitrogen || 0;

        // Formula:
        // Dry Weight = WetWeight * (100 - Moisture%) / 100
        // Carbon Mass = DryWeight * (C% / 100)
        // Nitrogen Mass = DryWeight * (N% / 100)
        
        // Simplified for code (percentages cancel out in ratio, but kept for clarity):
        const dryFactor = (100 - moisture); 
        
        // Weighted contribution
        totalCarbonMass += weight * dryFactor * C;
        totalNitrogenMass += weight * dryFactor * N;
    });

    const resultBox = document.getElementById("totalRatio");

    if (totalNitrogenMass === 0) {
        resultBox.value = totalCarbonMass > 0 ? "Infinite (Add Nitrogen)" : "0";
        return;
    }

    const ratio = totalCarbonMass / totalNitrogenMass;
    resultBox.value = `${ratio.toFixed(1)} : 1`;
};
