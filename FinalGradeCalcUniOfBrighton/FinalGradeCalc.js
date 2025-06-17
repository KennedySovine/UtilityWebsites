// FinalGradeCalc.js
function addClassRow(listId, isDefault = false, defaultName = '', defaultCredits = '') {
    const list = document.getElementById(listId);
    const row = document.createElement('div');
    row.className = 'class-row';
    const removeButton = isDefault ? '' : '<button type="button" class="remove-btn" title="Remove module">&times;</button>';
    row.innerHTML = `
        <input type="text" placeholder="Module Name" class="mod-name" value="${defaultName}" ${isDefault ? 'readonly' : ''} />
        <input type="number" min="0" max="100" placeholder="Mark" class="mod-mark" required />
        <input type="number" min="0" placeholder="Credits" class="mod-credits" required value="${defaultCredits}" />
        ${removeButton}
    `;
    if (!isDefault) {
        row.querySelector('.remove-btn').onclick = () => row.remove();
    }
    list.appendChild(row);
}

function getWeightedAverage(listId) {
    const rows = document.getElementById(listId).querySelectorAll('.class-row');
    let totalCredits = 0;
    let weightedSum = 0;
    rows.forEach(row => {
        const mark = parseFloat(row.querySelector('.mod-mark').value);
        const credits = parseFloat(row.querySelector('.mod-credits').value);
        if (!isNaN(mark) && !isNaN(credits) && credits > 0) {
            weightedSum += mark * credits;
            totalCredits += credits;
        }
    });    return totalCredits > 0 ? weightedSum / totalCredits : 0;
}

function getClassification(finalGrade) {
    if (finalGrade >= 70) {
        return "First-Class Honours (1st)";
    } else if (finalGrade >= 60) {
        return "Upper Second-Class Honours (2:1)";
    } else if (finalGrade >= 50) {
        return "Lower Second-Class Honours (2:2)";
    } else if (finalGrade >= 40) {
        return "Third-Class Honours (3rd)";
    } else {
        return "Fail";
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Add one row by default for Level 5
    addClassRow('l5-list');
    // Add the default Final Project row for Level 6
    addClassRow('l6-list', true, 'Final Project', '40');

    document.getElementById('gradeForm').onsubmit = function(e) {
        e.preventDefault();        const l5Avg = getWeightedAverage('l5-list');
        const l6Avg = getWeightedAverage('l6-list');
        const finalGrade = (l5Avg * 0.25) + (l6Avg * 0.75);
        const classification = getClassification(finalGrade);
        
        let resultText = `<strong>Level 5 Weighted Average:</strong> ${l5Avg.toFixed(2)}<br>`;
        resultText += `<strong>Level 6 Weighted Average:</strong> ${l6Avg.toFixed(2)}<br>`;
        resultText += `<strong>Final Grade:</strong> ${finalGrade.toFixed(2)}<br>`;
        resultText += `<strong>Degree Classification:</strong> ${classification}`;
        document.getElementById('result').innerHTML = resultText;
    };
});
