// script/compostScript.js
document.addEventListener("DOMContentLoaded", () => {
  fetch("../data/compost.json")              // adjust path if html is elsewhere
    .then(r => r.json())
    .then(buildTable)
    .catch(err => console.error("Data load error:", err));
});

function buildTable(data) {
  const tbody = document.querySelector("#compostTable tbody");
  data.forEach(item => {
    const tr = document.createElement("tr");
    tr.className = item.category.toLowerCase();   // green / brown row color
    tr.innerHTML = `
      <td>${item.name}</td>
      <td>${item.category}</td>
      <td>${item.cn_ratio}</td>
      <td>${item.decomposition}</td>
      <td>${item.notes}</td>`;
    tbody.appendChild(tr);
  });
  addSortHandlers();
}

function addSortHandlers() {
  document.querySelectorAll("#compostTable th").forEach(th => {
    th.addEventListener("click", () => {
      const rows = [...document.querySelectorAll("#compostTable tbody tr")];
      const asc = th.classList.toggle("asc");
      th.classList.toggle("desc", !asc);
      // reset arrows on other headers
      document.querySelectorAll("#compostTable th")
              .forEach(h => h !== th && h.classList.remove("asc", "desc"));

      rows.sort((a, b) => {
        const va = a.children[th.cellIndex].textContent.trim().toLowerCase();
        const vb = b.children[th.cellIndex].textContent.trim().toLowerCase();
        return asc ? va.localeCompare(vb) : vb.localeCompare(va);
      });
      rows.forEach(r => r.parentElement.appendChild(r));
    });
  });
}