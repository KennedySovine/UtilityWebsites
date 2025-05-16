function calculateTea() {
    const sizeInput = parseFloat(document.getElementById('containerSize').value);
    const unit = document.querySelector('input[name="unit"]:checked').value;
    if (isNaN(sizeInput) || sizeInput <= 0) {
        document.getElementById('result').style.display = 'none';
        document.getElementById('dynamicInstructions').innerHTML = '';
        return;
    }
    // Convert to ounces
    let sizeOz = sizeInput;
    if (unit === 'gal') {
        sizeOz = sizeInput * 128;
    } else if (unit === 'l') {
        sizeOz = sizeInput * 33.814;
    }
    // Recipe ratios (per 128 oz):
    // 1 pinch baking soda, 3 family-size tea bags, 1 cup sugar, water to fill
    const ratio = sizeOz / 128;
    const bakingSoda = ratio < 1 ? 'a small pinch' : `${(ratio).toFixed(2)} pinches`;
    const teaBags = (3 * ratio).toFixed(2);
    const sugarCups = (1 * ratio).toFixed(2);
    const water = sizeOz;

    document.getElementById('result').innerHTML = `
        <strong>For ${sizeInput} ${unit === 'oz' ? 'oz' : unit === 'gal' ? 'gallon(s)' : 'litre(s)'} of sweet tea:</strong><br>
        Baking Soda: <b>${bakingSoda}</b> (Optional)<br>
        Family-size Tea Bags: <b>${teaBags}</b><br>
        Sugar: <b>${sugarCups} cups</b><br>
        Water: <b>${water.toFixed(2)} oz</b>
    `;
    document.getElementById('result').style.display = 'block';

    // Dynamic instructions
    const halfWater = (water / 2).toFixed(2);
    document.getElementById('dynamicInstructions').innerHTML = `
        <strong>Instructions</strong><br>
        Boil <b>${halfWater} oz</b> of the water on stove in a pot. Once water comes to a roiling boil, pour into your container.<br><br>
        Add <b>${teaBags}</b> family-size tea bags and <b>${bakingSoda}</b> of baking soda (you don’t need to stir) to the container. Just make sure the bags are submerged in the water.<br><br>
        Set your kitchen timer for 15 minutes. After 15 minutes, take out tea bags. Do not squish tea bags before taking them out, just let them drip for a minute.<br><br>
        Add <b>${sugarCups} cups</b> sugar and stir.<br><br>
        Add the other <b>${halfWater} oz</b> of cold water to the container and stir again.<br><br>
        Chill completely in the refrigerator for several hours then serve in a glass with ice.
    `;
}
// Show default output for 128 oz on page load
window.onload = function() {
    calculateTea();
    // Add event listeners for unit change to recalculate
    document.querySelectorAll('input[name="unit"]').forEach(function(radio) {
        radio.addEventListener('change', calculateTea);
    });
};
