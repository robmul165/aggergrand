

function runAGModel() {

  /***********************************************
   * 1) READ FORM INPUTS
   ***********************************************/
  const soilName                     = document.getElementById("soilName").value.trim();
  const soilMedia                    = document.getElementById("soilMedia").value;
  const climateZone                  = document.getElementById("climateZone").value;
  const TEC_meq                      = parseFloat(document.getElementById("tecMeq").value);
  const pH                           = parseFloat(document.getElementById("ph").value);
  const organicMatterPercent         = parseFloat(document.getElementById("organicMatterPercent").value);
  const sampleDepth                  = parseFloat(document.getElementById("sampleDepth").value);

  const Ca_ppm                       = parseFloat(document.getElementById("calcium").value);
  const Mg_ppm                       = parseFloat(document.getElementById("magnesium").value);
  const K_ppm                        = parseFloat(document.getElementById("potassium").value);
  const Na_ppm                       = parseFloat(document.getElementById("sodium").value);
  const P_ppm                        = parseFloat(document.getElementById("phosphorus").value);
  const S_ppm                        = parseFloat(document.getElementById("sulfur").value);

  const B_ppm                        = parseFloat(document.getElementById("boron").value);
  const Fe_ppm                       = parseFloat(document.getElementById("iron").value);
  const Mn_ppm                       = parseFloat(document.getElementById("manganese").value);
  const Cu_ppm                       = parseFloat(document.getElementById("copper").value);
  const Zn_ppm                       = parseFloat(document.getElementById("zinc").value);
  const Al_ppm                       = parseFloat(document.getElementById("aluminum").value);

  const Exchangeable_H_base_saturation = parseFloat(document.getElementById("exchangeableHBaseSaturation").value);
  const bulkDensity                  = parseFloat(document.getElementById("bulkDensity").value);

  // Basic error handling
  if (isNaN(TEC_meq) || isNaN(pH) || isNaN(organicMatterPercent) || isNaN(sampleDepth) ||
      isNaN(Ca_ppm)  || isNaN(Mg_ppm) || isNaN(K_ppm) || isNaN(Na_ppm) ||
      isNaN(P_ppm)   || isNaN(S_ppm)  || isNaN(B_ppm) || isNaN(Fe_ppm) ||
      isNaN(Mn_ppm)  || isNaN(Cu_ppm) || isNaN(Zn_ppm) || isNaN(Al_ppm) ||
      isNaN(Exchangeable_H_base_saturation) || isNaN(bulkDensity)) {
    alert("Please fill out all required numeric fields correctly.");
    return;
  }

  /***********************************************
   * 2) DEFINE CONSTANTS / DEFAULTS
   * (These match your Python code)
   ***********************************************/
  // Hard-coded defaults, thresholds, or desired saturations:
  const Ca_desired_sat = 68;
  const Mg_desired_sat = 12;
  const K_desired_sat  = 8;
  const Na_desired_sat = 0.5;
  const H_desired_sat  = 10;

  // Minimum recommended ppm if TEC < 7 (per your code)
  const min_S_ppm = 50;
  const min_P_ppm = 100;
  const min_Ca_ppm = 1000;
  const min_Mg_ppm = 100;
  const min_K_ppm  = 100;
  const min_Na_ppm = 25;
  const min_B_ppm  = 1;
  const min_Fe_ppm = 50;
  const min_Mn_ppm = 25;
  const min_Cu_ppm = 5;
  const min_Zn_ppm = 10;

  // For micro ratio checks (example only, no direct use below):
  // const P_to_Zn_ideal = 10; 
  // etc.

  // Calculate some needed derived values
  // 1) Hydrogen in ppm from base saturation
  const H_ppm = TEC_meq * 10 * (Exchangeable_H_base_saturation / 100);

  // 2) Base saturations from your formula
  //    (For Ca: (Ca_ppm / [TEC_meq*10*(39.76623274/2)])*100 ) etc.
  const Ca_sat = (Ca_ppm / (TEC_meq * 10 * (39.76623274 / 2))) * 100;
  const Mg_sat = (Mg_ppm / (TEC_meq * 10 * (24.1159311 / 2))) * 100;
  const K_sat  = (K_ppm  / (TEC_meq * 10 * 38.79415383)) * 100;
  const Na_sat = (Na_ppm / (TEC_meq * 10 * 22.8109313))  * 100;
  const H_sat  = (H_ppm  / (TEC_meq * 10 * 1.0))          * 100;
  const other_sat = 100 - (Ca_sat + Mg_sat + K_sat + Na_sat + H_sat);

  // 3) Ideal ppm for major cations (from your formula):
  let Ca_ideal_ppm = (TEC_meq * 10 * (39.76623274 / 2)) * (Ca_desired_sat / 100);
  let Mg_ideal_ppm = (TEC_meq * 10 * (24.1159311 / 2))  * (Mg_desired_sat / 100);
  let K_ideal_ppm  = (TEC_meq * 10 * 38.79415383)       * (K_desired_sat / 100);
  let Na_ideal_ppm = (TEC_meq * 10 * 22.8109313)        * (Na_desired_sat / 100);
  let H_ideal_ppm  = (TEC_meq * 10 * 1.0)               * (H_desired_sat  / 100);

  // If TEC < 7, clamp to certain mins (per your code)
  if (TEC_meq < 7) {
    if (Ca_ideal_ppm < min_Ca_ppm) { Ca_ideal_ppm = min_Ca_ppm; }
    if (Mg_ideal_ppm < min_Mg_ppm) { Mg_ideal_ppm = min_Mg_ppm; }
    if (K_ideal_ppm  < min_K_ppm ) { K_ideal_ppm  = min_K_ppm;  }
    if (Na_ideal_ppm < min_Na_ppm) { Na_ideal_ppm = min_Na_ppm; }
  }

  // Similarly for P, S
  let P_ideal_ppm = K_ideal_ppm;       // your code says: P_ideal_ppm = K_ideal_ppm
  let S_ideal_ppm = 0.5 * K_ideal_ppm; // your code says: S_ideal_ppm = 1/2 * K_ideal_ppm

  if (TEC_meq < 7) {
    if (P_ideal_ppm < min_P_ppm) { P_ideal_ppm = min_P_ppm; }
    if (S_ideal_ppm < min_S_ppm) { S_ideal_ppm = min_S_ppm; }
  }

  // B_ideal, Fe_ideal, etc. (similar to your code)
  //   B_ideal_ppm = 1/1000 * Ca_ideal_ppm, etc. 
  let B_ideal_ppm  = (1/1000) * Ca_ideal_ppm;  // your code
  if (TEC_meq < 7 && B_ideal_ppm < min_B_ppm) {
    B_ideal_ppm = min_B_ppm;
  }

  let Fe_ideal_ppm = (5/12) * K_ideal_ppm;   
  let Mn_ideal_ppm = (5/12) * (5/12) * K_ideal_ppm; 
  let Zn_ideal_ppm = (1/10) * P_ideal_ppm;
  let Cu_ideal_ppm = (1/20) * K_ideal_ppm;

  if (TEC_meq < 7 && Fe_ideal_ppm < min_Fe_ppm) { Fe_ideal_ppm = min_Fe_ppm; }
  if (TEC_meq < 7 && Mn_ideal_ppm < min_Mn_ppm) { Mn_ideal_ppm = min_Mn_ppm; }
  if (TEC_meq < 7 && Zn_ideal_ppm < min_Zn_ppm) { Zn_ideal_ppm = min_Zn_ppm; }
  if (TEC_meq < 7 && Cu_ideal_ppm < min_Cu_ppm) { Cu_ideal_ppm = min_Cu_ppm; }

  /***********************************************
   * 3) CALCULATE DIFFERENCES & % OF IDEAL
   ***********************************************/
  // Majors
  const Ca_diff_ppm = Ca_ideal_ppm - Ca_ppm;
  const Mg_diff_ppm = Mg_ideal_ppm - Mg_ppm; // corrected variable name below 
  const K_diff_ppm  = K_ideal_ppm  - K_ppm;
  const Na_diff_ppm = Na_ideal_ppm - Na_ppm;
  const P_diff_ppm  = P_ideal_ppm  - P_ppm;
  const S_diff_ppm  = S_ideal_ppm  - S_ppm;


  // % of ideal
  const Ca_percent_ideal = (Ca_ppm / Ca_ideal_ppm) * 100;
  const Mg_percent_ideal = (Mg_ppm / Mg_ideal_ppm) * 100;
  const K_percent_ideal  = (K_ppm  / K_ideal_ppm)  * 100;
  const Na_percent_ideal = (Na_ppm / Na_ideal_ppm) * 100;
  const P_percent_ideal  = (P_ppm  / P_ideal_ppm)  * 100;
  const S_percent_ideal  = (S_ppm  / S_ideal_ppm)  * 100;

  // Micros
  const B_diff_ppm  = B_ideal_ppm  - B_ppm;
  const Fe_diff_ppm = Fe_ideal_ppm - Fe_ppm;
  const Mn_diff_ppm = Mn_ideal_ppm - Mn_ppm;
  const Cu_diff_ppm = Cu_ideal_ppm - Cu_ppm;
  const Zn_diff_ppm = Zn_ideal_ppm - Zn_ppm;

  const B_percent_ideal  = (B_ppm  / B_ideal_ppm ) * 100;
  const Fe_percent_ideal = (Fe_ppm / Fe_ideal_ppm) * 100;
  const Mn_percent_ideal = (Mn_ppm / Mn_ideal_ppm) * 100;
  const Cu_percent_ideal = (Cu_ppm / Cu_ideal_ppm) * 100;
  const Zn_percent_ideal = (Zn_ppm / Zn_ideal_ppm) * 100;

  // (Al, etc. not specifically used in your ideal calcs, but you can do so if needed.)

  /***********************************************
   * 4) BUILD A TEXT SUMMARY
   ***********************************************/
  let discussion = "";

  // Example for Calcium
  if (Ca_percent_ideal < 90) {
    discussion += "Calcium is below ideal; consider gypsum or limestone to raise levels.\n";
  } else if (Ca_percent_ideal > 110) {
    discussion += "Calcium is above ideal; over time, use sulfur-based amendments to help mitigate.\n";
  } else {
    discussion += "Calcium is within the ideal range.\n";
  }

  // Example for Magnesium
  if (Mg_percent_ideal < 90) {
    discussion += "Magnesium is below ideal; magnesium sulfate (Epsom salt) can help.\n";
  } else if (Mg_percent_ideal > 110) {
    discussion += "Magnesium is above ideal; elemental sulfur can gradually lower it.\n";
  } else {
    discussion += "Magnesium is within the ideal range.\n";
  }

  // (Repeat for K, Na, P, S, B, Fe, Mn, Cu, Zn, etc. if you like the same style)

  discussion += "\nSoil Name: " + soilName + "\n";
  discussion += "Soil Media: " + soilMedia + "\n";
  discussion += "Climate Zone: " + climateZone + "\n";

  // You can build out more statements based on your actual logic from Python.

  /***********************************************
   * 5) SHOW RESULTS IN SOME DIV
   ***********************************************/
  const resultsDiv = document.getElementById("results");
  if (resultsDiv) {
    const resultsText = 
`== AG Model Results ==

📊 TEC (meq): ${TEC_meq.toFixed(2)}
🌿 pH: ${pH.toFixed(2)}

🪨 Calcium % of Ideal:    ${Ca_percent_ideal.toFixed(1)}%
💧 Magnesium % of Ideal:  ${Mg_percent_ideal.toFixed(1)}%
🥔 Potassium % of Ideal:  ${K_percent_ideal.toFixed(1)}%
🧂 Sodium % of Ideal:     ${Na_percent_ideal.toFixed(1)}%
🧪 Phosphorus % of Ideal: ${P_percent_ideal.toFixed(1)}%
🌬️ Sulfur % of Ideal:     ${S_percent_ideal.toFixed(1)}%

🧬 Micronutrient % of Ideal:
  • B:  ${B_percent_ideal.toFixed(1)}%
  • Fe: ${Fe_percent_ideal.toFixed(1)}%
  • Mn: ${Mn_percent_ideal.toFixed(1)}%
  • Cu: ${Cu_percent_ideal.toFixed(1)}%
  • Zn: ${Zn_percent_ideal.toFixed(1)}%

📋 Recommendations:
${discussion}`;

  
  resultsDiv.textContent = resultsText;
  }

  /***********************************************
   * 6) MAKE A BAR CHART FOR MICRONUTRIENTS
   ***********************************************/
  // We'll compare B, Fe, Mn, Cu, Zn as “% of Ideal” 
  // (like your micro_bar in Python, but with Plotly in the browser)
  if (typeof Plotly !== "undefined" && document.getElementById("microBar")) {
    const microElements = ["B", "Fe", "Mn", "Cu", "Zn"];
    const microValues   = [
      B_percent_ideal,
      Fe_percent_ideal,
      Mn_percent_ideal,
      Cu_percent_ideal,
      Zn_percent_ideal
    ];

    const barTrace = {
      x: microElements,
      y: microValues,
      type: "bar"
    };
    const barLayout = {
      title: "Micronutrients (% of Ideal = 100%)",
      yaxis: { range: [0, 200] },
      shapes: [
        // You can emulate the colored bands (like 0-80 is low, 80-120 is green, etc.)
      ]
    };
    Plotly.newPlot("microBar", [barTrace], barLayout);
  }

  /***********************************************
   * 7) MAKE GAUGE CHARTS FOR Ca, Mg, K, Na, P, S
   ***********************************************/
  // Each gauge: 0-200% range, with 100% as the ideal.
  if (typeof Plotly !== "undefined") {
    makeGauge("caGauge",    Ca_percent_ideal, "Calcium % of Ideal");
    makeGauge("mgGauge",    Mg_percent_ideal, "Magnesium % of Ideal");
    makeGauge("kGauge",     K_percent_ideal,  "Potassium % of Ideal");
    makeGauge("naGauge",    Na_percent_ideal, "Sodium % of Ideal");
    makeGauge("pGauge",     P_percent_ideal,  "Phosphorus % of Ideal");
    makeGauge("sGauge",     S_percent_ideal,  "Sulfur % of Ideal");
  }
}

/***********************************************
 * GAUGE HELPER FUNCTION
 ***********************************************/
function makeGauge(divID, currentValue, titleText) {
  // If there's no element with that ID, do nothing
  const el = document.getElementById(divID);
  if (!el) return;

  const gaugeData = [{
    type: "indicator",
    mode: "gauge+number+delta",
    value: currentValue,
    title: { text: titleText, font: { size: 16 } },
    delta: { reference: 100, increasing: { color: "red" }, decreasing: { color: "blue" } },
    gauge: {
      axis: { range: [0, 200], tickwidth: 1, tickcolor: "#333" },
      steps: [
        { range: [0, 80],  color: "#d0d0ff" },
        { range: [80,120], color: "#c8f2c2" },
        { range: [120,200],color: "#ffd1d1" }
      ],
      threshold: {
        line: { color: "black", width: 3 },
        thickness: 0.75,
        value: 100
      }
    }
  }];

  const gaugeLayout = { margin: { t: 20, b: 20 } };
  Plotly.newPlot(divID, gaugeData, gaugeLayout);
}