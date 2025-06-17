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

    // Set up OCR functionality
    const processImageBtn = document.getElementById('processImage');
    const transcriptInput = document.getElementById('transcriptImage');
    
    processImageBtn.addEventListener('click', () => {
        const file = transcriptInput.files[0];
        if (file) {
            processGradeSheet(file);
        } else {
            alert('Please select an image file first.');
        }
    });
    
    // Allow processing on file selection
    transcriptInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            processGradeSheet(file);
        }
    });

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

// OCR and Image Processing Functions
async function processGradeSheet(imageFile) {
    const statusDiv = document.getElementById('ocrStatus');
    
    try {
        statusDiv.textContent = 'Processing image... This may take a moment.';
        statusDiv.className = 'ocr-status processing';
        statusDiv.style.display = 'block';
        
        // Check if Tesseract is loaded
        if (typeof Tesseract === 'undefined') {
            throw new Error('Tesseract.js library not loaded');
        }
        
        console.log('Starting OCR processing...');
        
        // Use Tesseract.js to extract text from image
        const { data: { text } } = await Tesseract.recognize(imageFile, 'eng', {
            logger: m => {
                console.log('OCR Progress:', m);
                if (m.status === 'recognizing text') {
                    statusDiv.textContent = `Processing... ${Math.round(m.progress * 100)}%`;
                }
            }
        });
        
        console.log('Extracted text:', text);
        
        // Parse the extracted text
        const { level5Modules, level6Modules } = parseGradeData(text);
        
        console.log('Parsed modules:', { level5Modules, level6Modules });
        
        // Clear existing modules except the default Final Project
        clearModules();
        
        // Add parsed modules
        populateModules(level5Modules, level6Modules);
        
        statusDiv.textContent = `Success! Found ${level5Modules.length} Level 5 and ${level6Modules.length} Level 6 modules.`;
        statusDiv.className = 'ocr-status success';
        setTimeout(() => statusDiv.style.display = 'none', 5000);
        
    } catch (error) {
        console.error('OCR Error:', error);
        statusDiv.textContent = `Error: ${error.message}. Please try again or enter data manually.`;
        statusDiv.className = 'ocr-status error';
        setTimeout(() => statusDiv.style.display = 'none', 8000);
    }
}

function parseGradeData(text) {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const level5Modules = [];
    const level6Modules = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip header lines, sub-assignments (01, 02), and unavailable results
        if (line.includes('Year Module Level Mark Grade Result Attempt Credit') || 
            line.includes('Results for module') || 
            line.includes('unavailable pending') ||
            line.match(/^0[1-9]\s+/) || // Skip lines starting with 01, 02, etc.
            line.includes('currently unavailable')) {
            continue;
        }
        
        // Case-insensitive pattern for table format: "2023/24 CI587 Web based game development 5} 78 A P 1 20.0"
        // Also handle "Ci517" (lowercase) and missing "}" character
        const tableMatch = line.match(/^(\d{4}\/\d{2})\s+([A-Za-z]+\d+)\s+(.+?)\s+([56])\}?\s+(\d{1,3})\s+([A-Z]+[+-]?)\s+[PF]\s+\d+\s+([\d.]+)/i);
        if (tableMatch) {
            const [, year, moduleCode, moduleName, level, mark, grade, credits] = tableMatch;
            const numericMark = parseInt(mark);
            const numericCredits = parseFloat(credits);
            const moduleLevel = parseInt(level);
            
            if (numericMark >= 0 && numericMark <= 100 && numericCredits > 0) {
                const module = {
                    name: `${moduleCode.toUpperCase()} - ${moduleName.trim()}`,
                    grade: numericMark,
                    credits: numericCredits
                };
                
                if (moduleLevel === 6) {
                    level6Modules.push(module);
                } else {
                    level5Modules.push(module);
                }
            }
            continue;
        }
        
        // More flexible pattern to catch variations: "2023/24 Ci517 Game Engine Fundamentals 5 65 B P 1 20.0"
        const flexibleMatch = line.match(/^(\d{4}\/\d{2})\s+([A-Za-z]+\d+)\s+(.+?)\s+([56])\s+(\d{1,3})\s+([A-Z]+[+-]?)/i);
        if (flexibleMatch) {
            const [, year, moduleCode, moduleName, level, mark, grade] = flexibleMatch;
            const numericMark = parseInt(mark);
            const moduleLevel = parseInt(level);
            
            // Extract credits from the rest of the line if available
            const creditMatch = line.match(/([\d.]+)$/);
            const credits = creditMatch ? parseFloat(creditMatch[1]) : 20.0; // Default to 20 if not found
            
            if (numericMark >= 0 && numericMark <= 100) {
                const module = {
                    name: `${moduleCode.toUpperCase()} - ${moduleName.trim()}`,
                    grade: numericMark,
                    credits: credits
                };
                
                if (moduleLevel === 6) {
                    level6Modules.push(module);
                } else {
                    level5Modules.push(module);
                }
            }
            continue;
        }
        
        // Even more lenient pattern for edge cases
        const lenientMatch = line.match(/(\d{4}\/\d{2})\s+([A-Za-z]+\d+)\s+(.+?)\s+([56]).*?(\d{1,3})\s+([A-Z]+[+-]?)/i);
        if (lenientMatch) {
            const [, year, moduleCode, moduleName, level, mark, grade] = lenientMatch;
            const numericMark = parseInt(mark);
            const moduleLevel = parseInt(level);
            
            if (numericMark >= 0 && numericMark <= 100) {
                const module = {
                    name: `${moduleCode.toUpperCase()} - ${moduleName.trim()}`,
                    grade: numericMark,
                    credits: 20.0 // Default credits
                };
                
                if (moduleLevel === 6) {
                    level6Modules.push(module);
                } else {
                    level5Modules.push(module);
                }
            }
            continue;
        }
        
        // Handle modules without grades (Level 6 pending): "2024/25 C1601 The Computing Project 6"
        const pendingMatch = line.match(/^(\d{4}\/\d{2})\s+([A-Za-z]+\d+)\s+(.+?)\s+([56])$/i);
        if (pendingMatch) {
            const [, year, moduleCode, moduleName, level] = pendingMatch;
            const moduleLevel = parseInt(level);
            
            // Only add if it's a final project
            if (moduleName.toLowerCase().includes('project') && moduleLevel === 6) {
                const module = {
                    name: `${moduleCode.toUpperCase()} - ${moduleName.trim()}`,
                    grade: 0, // Placeholder - user can fill in later
                    credits: 40 // Typical final project credits
                };
                level6Modules.push(module);
            }
            continue;
        }
    }
    
    console.log('Parsed modules:', { level5Modules, level6Modules });
    return { level5Modules, level6Modules };
}

function clearModules() {
    // Clear Level 5 modules
    const l5List = document.getElementById('l5-list');
    l5List.innerHTML = '';
    
    // Clear Level 6 modules but keep Final Project
    const l6List = document.getElementById('l6-list');
    l6List.innerHTML = '';
    
    // Re-add default Final Project
    addClassRow('l6-list', true, 'Final Project', '40');
}

function populateModules(level5Modules, level6Modules) {
    // Add Level 5 modules
    level5Modules.forEach(module => {
        addClassRow('l5-list');
        const rows = document.getElementById('l5-list').querySelectorAll('.class-row');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.mod-name').value = module.name;
        lastRow.querySelector('.mod-mark').value = module.grade;
        lastRow.querySelector('.mod-credits').value = module.credits;
    });
    
    // Add Level 6 modules
    let finalProjectUpdated = false;
    
    level6Modules.forEach(module => {
        // Check if this might be the final project
        const isFinalProject = module.name.toLowerCase().includes('project') && 
                              module.credits >= 30;
        
        if (isFinalProject && !finalProjectUpdated) {
            // Update the existing Final Project row
            const finalProjectRow = document.querySelector('#l6-list .class-row');
            if (finalProjectRow) {
                finalProjectRow.querySelector('.mod-name').value = module.name;
                finalProjectRow.querySelector('.mod-mark').value = module.grade;
                finalProjectRow.querySelector('.mod-credits').value = module.credits;
                finalProjectUpdated = true;
                return;
            }
        }
        
        // Add as new module
        addClassRow('l6-list');
        const rows = document.getElementById('l6-list').querySelectorAll('.class-row');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.mod-name').value = module.name;
        lastRow.querySelector('.mod-mark').value = module.grade;
        lastRow.querySelector('.mod-credits').value = module.credits;
    });
    
    // Ensure we have at least one regular row for Level 5 if empty
    if (level5Modules.length === 0) {
        addClassRow('l5-list');
    }
}
