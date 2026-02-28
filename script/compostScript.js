// script/compostScript.js

// State to track calculator slots
const calcState = [
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 },
    { name: "", weight: 0, moisture: 0, nitrogen: 0, carbon: 0 }
];

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Calculator Rows
  renderCalcRows();

  // Attach Event Listeners for Calculator
  document.getElementById("calculateBtn").addEventListener("click", calculateRatio);
  document.getElementById("resetBtn").addEventListener("click", resetCalculator);

  // Load Table Data
  fetch("../data/compost.json")
    .then(r => r.json())
    .then(buildTable)
    .catch(err => console.error("Data load error:", err));
});

/* ================= TABLE LOGIC ================= */

function buildTable(data) {
  const tbody = document.querySelector("#compostTable tbody");
  tbody.innerHTML = ""; // Clear existing

  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = item.category ? item.category.toLowerCase() : ""; 
    
    // Create Select Button
    const btnId = `btn-${item.name.replace(/\s+/g, '')}`;
    
    tr.innerHTML = `
      <td><button class="btn btn-select" data-item='${JSON.stringify(item)}'>Select</button></td>
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
      const itemData = JSON.parse(e.target.getAttribute("data-item"));
      addToCalculator(itemData);
      // Optional: Scroll to calculator
      document.querySelector(".calc-container").scrollIntoView({ behavior: 'smooth' });
    });
  });

  addSortHandlers();
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

/* ================= CALCULATOR LOGIC ================= */

function addToCalculator(item) {
    // Find first empty slot or overwrite the last one if full
    let index = calcState.findIndex(s => s.name === "");
    if (index === -1) index = 2; // Default to last slot if full

    // Parse Data Helper
    const parseNum = (val) => {
        if (!val) return 0;
        // Remove ~, >, <, :1 and other non-numeric chars except .
        const clean = val.toString().replace(/[^0-9.]/g, ''); 
        return parseFloat(clean) || 0;
    };

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