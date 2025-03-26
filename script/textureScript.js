document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("calculateBtn").addEventListener("click", function (e) {
    e.preventDefault();

    const sandValue = parseFloat(document.getElementById("sandHeight").value);
    const siltValue = parseFloat(document.getElementById("siltHeight").value);
    const clayValue = parseFloat(document.getElementById("clayHeight").value);

    const sandUnit = document.getElementById("sandUnit").value;
    const siltUnit = document.getElementById("siltUnit").value;
    const clayUnit = document.getElementById("clayUnit").value;

    const resultBox = document.getElementById("result");
    const errorMsg = document.getElementById("errorMsg");

    // Clear any previous result or error
    resultBox.classList.add("hidden");
    errorMsg.textContent = "";
    errorMsg.classList.add("hidden");

    // Validate inputs
    if (isNaN(sandValue) || isNaN(siltValue) || isNaN(clayValue)) {
      errorMsg.textContent = "Please enter valid numeric values for sand, silt, and clay layers.";
      errorMsg.classList.remove("hidden");
      resultBox.classList.remove("hidden");
      return;
    }

    let sandPercent, siltPercent, clayPercent;
    const allPercent = sandUnit === "%" && siltUnit === "%" && clayUnit === "%";

    if (allPercent) {
      sandPercent = sandValue;
      siltPercent = siltValue;
      clayPercent = clayValue;
    } else {
      if (sandUnit === "%" || siltUnit === "%" || clayUnit === "%") {
        errorMsg.textContent = "Please use either all percentages or all height measurements — not both.";
        errorMsg.classList.remove("hidden");
        resultBox.classList.remove("hidden");
        return;
      }

      const sandInches = convertToInches(sandValue, sandUnit);
      const siltInches = convertToInches(siltValue, siltUnit);
      const clayInches = convertToInches(clayValue, clayUnit);

      const total = sandInches + siltInches + clayInches;
      if (total <= 0) {
        errorMsg.textContent = "Please enter valid values for sand, silt, and clay layers.";
        errorMsg.classList.remove("hidden");
        resultBox.classList.remove("hidden");
        return;
      }

      sandPercent = (sandInches / total) * 100;
      siltPercent = (siltInches / total) * 100;
      clayPercent = (clayInches / total) * 100;
    }

    sandPercent = +sandPercent.toFixed(1);
    siltPercent = +siltPercent.toFixed(1);
    clayPercent = +clayPercent.toFixed(1);

    if (Math.abs(sandPercent + siltPercent + clayPercent - 100) > 1) {
      errorMsg.textContent = "Error: The percentages must add up to 100.";
      errorMsg.classList.remove("hidden");
      resultBox.classList.remove("hidden");
      return;
    }

    const texture = classifySoil(sandPercent, siltPercent, clayPercent);

    document.getElementById("sandPercent").textContent = sandPercent + "%";
    document.getElementById("siltPercent").textContent = siltPercent + "%";
    document.getElementById("clayPercent").textContent = clayPercent + "%";
    document.getElementById("soilTexture").textContent = texture;

    resultBox.classList.remove("hidden");
  });

  function convertToInches(value, unit) {
    if (unit === "cm") return value / 2.54;
    if (unit === "mm") return value / 25.4;
    return value;
  }
  
  function classifySoil(sand, silt, clay) {
    let texture = '';
  
    // Prioritize overlapping zones correctly
    if (sand >= 70 && sand < 90 && silt <= 30 && clay <= 15) {
      texture = 'Loamy Sand';
    } else if (sand >= 85 && silt <= 10 && clay <= 10) {
      texture = 'Sand';
    } else if (sand >= 43 && sand < 85 && silt < 50 && clay < 20) {
      texture = 'Sandy Loam';
    } else if ((silt >= 50 && clay >= 12 && clay <= 27) || (silt >= 50 && silt < 80 && clay < 12)) {
      texture = 'Silt Loam';
    } else if (silt >= 80 && clay < 12) {
      texture = 'Silt';
    } else if (clay >= 7 && clay <= 27 && silt >= 28 && silt <= 50 && sand <= 52) {
      texture = 'Loam';
    } else if (clay >= 27 && clay <= 40 && sand <= 20) {
      texture = 'Silty Clay Loam';
    } else if (clay >= 27 && clay <= 40 && sand > 20 && sand <= 46) {
      texture = 'Clay Loam';
    } else if (clay >= 20 && clay <= 35 && silt < 28 && sand > 45) {
      texture = 'Sandy Clay Loam';
    } else if (clay >= 40 && silt >= 40 && sand < 20) {
      texture = 'Silty Clay';
    } else if (clay >= 35 && sand >= 45 && silt < 20) {
      texture = 'Sandy Clay';
    } else if (clay >= 40 && sand <= 45 && silt < 40) {
      texture = 'Clay';
    } else {
      texture = 'No matching texture found';
    }
  
    return texture;
  }
});