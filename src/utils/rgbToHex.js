
function rgbToHex(rgb) {
  // Helper function to convert a single color component to hex
  const componentToHex = (component) => {
    const hex = Math.round(component * 255).toString(16); // Scale to 0-255 and convert to hex
    return hex.padStart(2, '0'); // Ensure two-digit format
  };

  // Construct hex color
  const red = componentToHex(rgb.red || 0);
  const green = componentToHex(rgb.green || 0);
  const blue = componentToHex(rgb.blue || 0);

  return `#${red}${green}${blue}`; // Combine into hex format
}

module.exports = rgbToHex;