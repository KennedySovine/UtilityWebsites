// FinalGradeCalc.js
function addClassRow(listId, isDefault = false, defaultName = '', defaultCredits = '') {
    const list = document.getElementById(listId);
    const row = document.createElement('div');
    row.className = 'class-row';
    const removeButton = isDefault ? '' : '<button type="button" class="remove-btn" title="Remove module">&times;</button>';
    
    // Auto-set credits to 20 for new modules, unless it's a final project or credits are explicitly provided
    let autoCredits = defaultCredits;
    if (!defaultCredits && !isDefault) {
        autoCredits = '20'; // Default to 20 credits for new modules
    } else if (!defaultCredits && isDefault && defaultName.toLowerCase().includes('project')) {
        autoCredits = '40'; // Default to 40 credits for final projects
    } else if (!defaultCredits) {
        autoCredits = '20'; // Default fallback
    }
    
    row.innerHTML = `
        <input type="text" placeholder="Module Name" class="mod-name" value="${defaultName}" ${isDefault ? 'readonly' : ''} />
        <input type="number" min="0" max="100" placeholder="Mark" class="mod-mark" required />
        <input type="number" min="0" placeholder="Credits" class="mod-credits" required value="${autoCredits}" />
        ${removeButton}
    `;    
    // Add event listener for credits input to check for 0 credits
    const creditsInput = row.querySelector('.mod-credits');
    const nameInput = row.querySelector('.mod-name');
    const markInput = row.querySelector('.mod-mark');
    
    // Add event listener to automatically adjust credits when module name changes
    nameInput.addEventListener('input', function() {
        if (!isDefault && this.value.toLowerCase().includes('project')) {
            // If user types a project name, set credits to 40
            if (creditsInput.value === '20' || creditsInput.value === '') {
                creditsInput.value = '40';
            }
        } else if (!isDefault && !this.value.toLowerCase().includes('project')) {
            // If user removes "project" from name, set credits back to 20
            if (creditsInput.value === '40') {
                creditsInput.value = '20';
            }
        }
    });
    
    creditsInput.addEventListener('change', async function() {
        console.log('Credits changed to:', this.value);
        if (this.value === '0' || this.value === '0.0') {
            const moduleName = nameInput.value || 'Unknown Module';
            const moduleGrade = markInput.value || '0';
            
            console.log('Zero credits detected for:', moduleName, 'with grade:', moduleGrade);
            
            // Show dialog even if module has no name
            console.log('Showing compensated credit dialog');
            const result = await handleCompensatedCredit(moduleName, moduleGrade || '0');
            console.log('Dialog result:', result);
            
            if (result.include) {
                this.value = result.credits;
                if (result.grade && result.grade !== '0') {
                    markInput.value = result.grade;
                }
            } else {
                // User chose to exclude - remove the row if not default
                if (!isDefault) {
                    row.remove();
                } else {
                    // Clear the default row
                    nameInput.value = defaultName;
                    markInput.value = '';
                    this.value = defaultCredits;
                }
            }
        }
    });
    
    // Also add blur event as backup
    creditsInput.addEventListener('blur', async function() {
        if (this.value === '0' || this.value === '0.0') {
            const moduleName = nameInput.value || 'Unknown Module';
            const moduleGrade = markInput.value || '0';
            
            const result = await handleCompensatedCredit(moduleName, moduleGrade || '0');
            if (result.include) {
                this.value = result.credits;
                if (result.grade && result.grade !== '0') {
                    markInput.value = result.grade;
                }
            } else {
                if (!isDefault) {
                    row.remove();
                } else {
                    nameInput.value = defaultName;
                    markInput.value = '';
                    this.value = defaultCredits;
                }
            }
        }
    });
    
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

function checkBorderlineEligibility(finalGrade, level5Modules, level6Modules) {
    let borderlineInfo = {
        isBorderline: false,
        currentClass: getClassification(finalGrade),
        potentialClass: null,
        primaryCriterion: false,
        secondaryCriterion: false,
        level6HigherCredits: 0,
        level5And6HigherCredits: 0,
        details: []
    };
    
    // Check borderline zones (2% below classification thresholds)
    let isInBorderlineZone = false;
    let higherThreshold = 0;
    let higherClass = "";
    
    if (finalGrade >= 68 && finalGrade < 70) {
        // Borderline for 1st class
        isInBorderlineZone = true;
        higherThreshold = 70;
        higherClass = "First-Class Honours (1st)";
    } else if (finalGrade >= 58 && finalGrade < 60) {
        // Borderline for 2:1
        isInBorderlineZone = true;
        higherThreshold = 60;
        higherClass = "Upper Second-Class Honours (2:1)";
    } else if (finalGrade >= 48 && finalGrade < 50) {
        // Borderline for 2:2
        isInBorderlineZone = true;
        higherThreshold = 50;
        higherClass = "Lower Second-Class Honours (2:2)";
    } else if (finalGrade >= 38 && finalGrade < 40) {
        // Borderline for 3rd
        isInBorderlineZone = true;
        higherThreshold = 40;
        higherClass = "Third-Class Honours (3rd)";
    }
    
    if (!isInBorderlineZone) {
        return borderlineInfo;
    }
    
    borderlineInfo.isBorderline = true;
    borderlineInfo.potentialClass = higherClass;
    
    // Calculate credits in higher classification for Level 6
    let level6HigherCredits = 0;
    let level6TotalCredits = 0;
    
    level6Modules.forEach(module => {
        if (module.grade >= higherThreshold && module.credits > 0) {
            level6HigherCredits += module.credits;
        }
        if (module.credits > 0) {
            level6TotalCredits += module.credits;
        }
    });
    
    borderlineInfo.level6HigherCredits = level6HigherCredits;
    
    // Primary criterion: 50% or more credits at Level 6 in higher classification
    if (level6TotalCredits > 0 && (level6HigherCredits / level6TotalCredits) >= 0.5) {
        borderlineInfo.primaryCriterion = true;
        borderlineInfo.details.push(`✅ Primary criterion met: ${level6HigherCredits} out of ${level6TotalCredits} Level 6 credits (${((level6HigherCredits / level6TotalCredits) * 100).toFixed(1)}%) at ${higherThreshold}% or above`);
    } else {
        borderlineInfo.details.push(`❌ Primary criterion not met: ${level6HigherCredits} out of ${level6TotalCredits} Level 6 credits (${level6TotalCredits > 0 ? ((level6HigherCredits / level6TotalCredits) * 100).toFixed(1) : 0}%) at ${higherThreshold}% or above (need 50%)`);
    }
    
    // Secondary criterion: 50% credits across Levels 5&6 with at least 40 credits at Level 6
    let level5HigherCredits = 0;
    let level5TotalCredits = 0;
    
    level5Modules.forEach(module => {
        if (module.grade >= higherThreshold && module.credits > 0) {
            level5HigherCredits += module.credits;
        }
        if (module.credits > 0) {
            level5TotalCredits += module.credits;
        }
    });
    
    let totalHigherCredits = level5HigherCredits + level6HigherCredits;
    let totalCredits = level5TotalCredits + level6TotalCredits;
    
    borderlineInfo.level5And6HigherCredits = totalHigherCredits;
    
    if (totalCredits > 0 && (totalHigherCredits / totalCredits) >= 0.5 && level6HigherCredits >= 40) {
        borderlineInfo.secondaryCriterion = true;
        borderlineInfo.details.push(`✅ Secondary criterion met: ${totalHigherCredits} out of ${totalCredits} total credits (${((totalHigherCredits / totalCredits) * 100).toFixed(1)}%) at ${higherThreshold}% or above, with ${level6HigherCredits} Level 6 credits (need 40+)`);
    } else {
        borderlineInfo.details.push(`❌ Secondary criterion not met: ${totalHigherCredits} out of ${totalCredits} total credits (${totalCredits > 0 ? ((totalHigherCredits / totalCredits) * 100).toFixed(1) : 0}%) at ${higherThreshold}% or above, with ${level6HigherCredits} Level 6 credits (need 50% total and 40+ Level 6 credits)`);
    }
    
    return borderlineInfo;
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
    });    document.getElementById('gradeForm').onsubmit = function(e) {
        e.preventDefault();
        const l5Avg = getWeightedAverage('l5-list');
        const l6Avg = getWeightedAverage('l6-list');
        const finalGrade = (l5Avg * 0.25) + (l6Avg * 0.75);
        const classification = getClassification(finalGrade);
        
        // Get module data for borderline analysis
        const level5ModuleData = [];
        const level6ModuleData = [];
        
        // Extract Level 5 module data
        document.getElementById('l5-list').querySelectorAll('.class-row').forEach(row => {
            const grade = parseFloat(row.querySelector('.mod-mark').value);
            const credits = parseFloat(row.querySelector('.mod-credits').value);
            if (!isNaN(grade) && !isNaN(credits) && credits > 0) {
                level5ModuleData.push({ grade, credits });
            }
        });
        
        // Extract Level 6 module data
        document.getElementById('l6-list').querySelectorAll('.class-row').forEach(row => {
            const grade = parseFloat(row.querySelector('.mod-mark').value);
            const credits = parseFloat(row.querySelector('.mod-credits').value);
            if (!isNaN(grade) && !isNaN(credits) && credits > 0) {
                level6ModuleData.push({ grade, credits });
            }
        });
        
        // Check borderline eligibility
        const borderlineInfo = checkBorderlineEligibility(finalGrade, level5ModuleData, level6ModuleData);
        
        let resultText = `<strong>Level 5 Weighted Average:</strong> ${l5Avg.toFixed(2)}<br>`;
        resultText += `<strong>Level 6 Weighted Average:</strong> ${l6Avg.toFixed(2)}<br>`;
        resultText += `<strong>Final Grade:</strong> ${finalGrade.toFixed(2)}<br>`;
        resultText += `<strong>Current Classification:</strong> ${classification}<br>`;
        
        // Add borderline analysis if applicable
        if (borderlineInfo.isBorderline) {
            resultText += `<br><div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 10px 0;">`;
            resultText += `<h4 style="margin: 0 0 10px 0; color: #856404;">🎯 Borderline Classification Analysis</h4>`;
            resultText += `<p style="margin: 5px 0;"><strong>You are in the 2% borderline zone for ${borderlineInfo.potentialClass}!</strong></p>`;
            
            if (borderlineInfo.primaryCriterion || borderlineInfo.secondaryCriterion) {
                resultText += `<p style="margin: 5px 0; color: #28a745;"><strong>✅ POSSIBLE UPGRADE: You may be eligible for ${borderlineInfo.potentialClass}</strong></p>`;
                resultText += `<p style="margin: 5px 0; font-size: 0.9em; color: #666;"><em>Note: This is not guaranteed - final decisions are made by the Examination Board.</em></p>`;
            } else {
                resultText += `<p style="margin: 5px 0; color: #dc3545;"><strong>❌ Upgrade criteria not met</strong></p>`;
                resultText += `<p style="margin: 5px 0; font-size: 0.9em; color: #666;"><em>You remain at ${borderlineInfo.currentClass}</em></p>`;
            }
            
            resultText += `<details style="margin: 10px 0;"><summary style="cursor: pointer; font-weight: bold;">📋 Detailed Analysis</summary>`;
            resultText += `<div style="margin: 10px 0; font-size: 0.9em;">`;
            borderlineInfo.details.forEach(detail => {
                resultText += `<p style="margin: 3px 0;">${detail}</p>`;
            });
            resultText += `</div></details>`;
            resultText += `</div>`;
        }
        
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
        
        // Add parsed modules (now async due to compensated credit warnings)
        await populateModules(level5Modules, level6Modules);
        
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
        }        // Case-insensitive pattern for table format: "2023/24 CI514 Embedded Systems 5 30 E- F 1 0.0"
        // Also handle OCR errors like "Cis14" instead of "CI514"
        const tableMatch = line.match(/^(\d{4}\/\d{2})\s+([A-Za-z]+\d+)\s+(.+?)\s+([56])\s+(\d{1,3})\s+([A-Z]+[+-]?)\s+[PF]\s+\d+\s+([\d.]+)/i);
        if (tableMatch) {
            const [, year, moduleCode, moduleName, level, mark, grade, credits] = tableMatch;
            
            // Normalize module code to handle OCR errors
            let normalizedCode = moduleCode.toUpperCase();
            // Convert "CIS14" to "CI514", "CI14" to "CI514", etc.
            if (normalizedCode.match(/^CI[S]?\d{2}$/)) {
                normalizedCode = normalizedCode.replace(/^CIS(\d{2})$/, 'CI5$1');
                normalizedCode = normalizedCode.replace(/^CI(\d{2})$/, 'CI5$1');
            }
            
            // Skip modules where the 3-digit number starts with 4 (ignore first 2 letters)
            const numberPart = normalizedCode.match(/(\d{3})$/);
            if (numberPart && numberPart[1].startsWith('4')) {
                continue;
            }
            
            const numericMark = parseInt(mark);
            const numericCredits = parseFloat(credits);
            const moduleLevel = parseInt(level);
            
            // Accept modules with 0 or more credits (changed from > 0 to >= 0)
            if (numericMark >= 0 && numericMark <= 100 && numericCredits >= 0) {
                // Keep original credits (including 0) for proper compensated credit handling
                let finalCredits = numericCredits;
                
                const module = {
                    name: `${normalizedCode} - ${moduleName.trim()}`,
                    grade: numericMark,
                    credits: finalCredits
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
        const flexibleMatch = line.match(/^(\d{4}\/\d{2})\s+([A-Za-z]+\d+)\s+(.+?)\s+([56])\s+(\d{1,3})\s+([A-Z]+[+-]?)/i);        if (flexibleMatch) {
            const [, year, moduleCode, moduleName, level, mark, grade] = flexibleMatch;
            
            // Skip modules where the 3-digit number starts with 4 (ignore first 2 letters)
            const moduleCodeUpper = moduleCode.toUpperCase();
            const numberPart = moduleCodeUpper.match(/(\d{3})$/);
            if (numberPart && numberPart[1].startsWith('4')) {
                continue;
            }
              const numericMark = parseInt(mark);
            const moduleLevel = parseInt(level);
            
            // Extract credits from the rest of the line if available
            const creditMatch = line.match(/([\d.]+)$/);
            const extractedCredits = creditMatch ? parseFloat(creditMatch[1]) : 20.0;
            
            // Default to 20 credits for all modules except final year projects
            let finalCredits = 20;
            if (moduleLevel === 6 && moduleName.toLowerCase().includes('project')) {
                finalCredits = extractedCredits; // Keep original credits for final projects
            }
            
            if (numericMark >= 0 && numericMark <= 100) {
                const module = {
                    name: `${moduleCodeUpper} - ${moduleName.trim()}`,
                    grade: numericMark,
                    credits: finalCredits
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
        const lenientMatch = line.match(/(\d{4}\/\d{2})\s+([A-Za-z]+\d+)\s+(.+?)\s+([56]).*?(\d{1,3})\s+([A-Z]+[+-]?)/i);        if (lenientMatch) {
            const [, year, moduleCode, moduleName, level, mark, grade] = lenientMatch;
            
            // Skip modules where the 3-digit number starts with 4 (ignore first 2 letters)
            const moduleCodeUpper = moduleCode.toUpperCase();
            const numberPart = moduleCodeUpper.match(/(\d{3})$/);
            if (numberPart && numberPart[1].startsWith('4')) {
                continue;
            }
              const numericMark = parseInt(mark);
            const moduleLevel = parseInt(level);
            
            if (numericMark >= 0 && numericMark <= 100) {
                // Default to 20 credits for all modules except final year projects
                let finalCredits = 20;
                if (moduleLevel === 6 && moduleName.toLowerCase().includes('project')) {
                    finalCredits = 40; // Default final project credits
                }
                
                const module = {
                    name: `${moduleCodeUpper} - ${moduleName.trim()}`,
                    grade: numericMark,
                    credits: finalCredits
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

async function populateModules(level5Modules, level6Modules) {
    // Process Level 5 modules
    for (const module of level5Modules) {
        // Check for zero credits and handle compensated credit
        if (module.credits === 0) {
            const result = await handleCompensatedCredit(module.name, module.grade);
            if (!result.include) {
                continue; // Skip this module
            }
            module.credits = result.credits;
            module.grade = result.grade;
        } else {
            // Default to 20 credits for normal Level 5 modules
            module.credits = 20;
        }
        
        addClassRow('l5-list');
        const rows = document.getElementById('l5-list').querySelectorAll('.class-row');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.mod-name').value = module.name;
        lastRow.querySelector('.mod-mark').value = module.grade;
        lastRow.querySelector('.mod-credits').value = module.credits;
    }
    
    // Process Level 6 modules
    let finalProjectUpdated = false;
    
    for (const module of level6Modules) {
        // Check for zero credits and handle compensated credit
        if (module.credits === 0) {
            const result = await handleCompensatedCredit(module.name, module.grade);
            if (!result.include) {
                continue; // Skip this module
            }
            module.credits = result.credits;
            module.grade = result.grade;
        } else {
            // Set appropriate credits for Level 6 modules
            if (module.name.toLowerCase().includes('project')) {
                // Keep original credits for projects (usually 40)
                module.credits = module.credits > 0 ? module.credits : 40;
            } else {
                // Default to 20 credits for normal Level 6 modules
                module.credits = 20;
            }
        }
        
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
                continue;
            }
        }
        
        // Add as new module
        addClassRow('l6-list');
        const rows = document.getElementById('l6-list').querySelectorAll('.class-row');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.mod-name').value = module.name;
        lastRow.querySelector('.mod-mark').value = module.grade;
        lastRow.querySelector('.mod-credits').value = module.credits;
    }
    
    // Ensure we have at least one regular row for Level 5 if empty
    if (level5Modules.length === 0) {
        addClassRow('l5-list');
    }
}

// Function to handle compensated credit warnings
async function handleCompensatedCredit(moduleName, originalGrade) {
    return new Promise((resolve) => {
        // Remove any existing modals first
        const existingModals = document.querySelectorAll('[id^="modal-"]');
        existingModals.forEach(modal => modal.remove());
        
        const modalId = 'modal-' + Date.now();
        let resolved = false; // Prevent multiple resolutions
        
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white; padding: 2em; border-radius: 10px; max-width: 500px;
            text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        
        dialog.innerHTML = `
            <h3>⚠️ Zero Credits Detected</h3>
            <p><strong>${moduleName}</strong></p>
            <p>This module shows 0 credits. Did you receive <strong>compensated credit</strong> for this module?</p>
            <p><em>Compensated credit means you passed despite a low grade due to strong performance in other modules.</em></p>
        `;
        
        // Create buttons
        const yesButton = document.createElement('button');
        yesButton.textContent = `Yes - Use Grade (${originalGrade}) with 20 Credits`;
        yesButton.style.cssText = 'background: #4caf50; color: white; border: none; padding: 0.7em 1.5em; margin: 0.5em 0.25em; border-radius: 5px; cursor: pointer; display: block; width: 100%; margin-bottom: 10px;';
        
        const noButton = document.createElement('button');
        noButton.textContent = 'No - Exclude Module';
        noButton.style.cssText = 'background: #f44336; color: white; border: none; padding: 0.7em 1.5em; margin: 0.5em 0.25em; border-radius: 5px; cursor: pointer; display: block; width: 100%;';
        
        // Function to close modal and resolve
        function closeAndResolve(result) {
            if (resolved) return; // Prevent multiple calls
            resolved = true;
            
            console.log('Closing modal with result:', result);
            
            // Force remove modal immediately
            modal.style.display = 'none';
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 0);
            
            resolve(result);
        }
        
        // Add event listeners
        yesButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Yes button clicked');
            closeAndResolve({ include: true, credits: 20, grade: originalGrade });
        });
        
        noButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('No button clicked');
            closeAndResolve({ include: false });
        });
        
        // Append buttons to dialog
        dialog.appendChild(yesButton);
        dialog.appendChild(noButton);
        
        modal.appendChild(dialog);
        document.body.appendChild(modal);
        
        // Click outside to close
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                console.log('Modal background clicked');
                closeAndResolve({ include: false });
            }
        });
        
        // Prevent dialog clicks from bubbling
        dialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        console.log('Modal created and added to DOM with ID:', modalId);
    });
}
