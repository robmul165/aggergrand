function adjustValue(id, amount) {
    let input = document.getElementById(id);
    let currentValue = parseFloat(input.value) || 0;
    let step = parseFloat(input.step) || 1;
    let newValue = (currentValue + amount * step).toFixed(1); // Adjusts value in correct increments
    input.value = newValue;
  }