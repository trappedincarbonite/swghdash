// Filename: modselector.js
// Updated: 2026-05-18 21:55
// Description: Core logic for the Mod Selector Overlay. Refactored primary selector to act as an exclusionary row filter.

// --- Global State ---
window.shapes = ['Square', 'Arrow', 'Diamond', 'Triangle', 'Circle', 'Cross'];
window.rawSets = ['Health', 'Defense', 'Crit Damage', 'Crit Chance', 'Potency', 'Tenacity', 'Offense', 'Speed'];
window.rawPrimaries = ['Speed', 'Offense', 'Defense', 'Health', 'Protection', 'Potency', 'Tenacity', 'Crit Damage', 'Crit Chance', 'Crit Avoid', 'Accuracy'];
window.setIconMapping = { 'Health': 'health', 'Defense': 'defense', 'Crit Damage': 'criticaldamage', 'Crit Chance': 'criticalchance', 'Tenacity': 'tenacity', 'Potency': 'potency', 'Offense': 'offense', 'Speed': 'speed' };

window.allUnits = [];
window.globalHeaderData = null;
window.currentSortCol = 'name';
window.currentSortDir = 'asc';
window.selection = { shape: null, sets: [], primary: null };

// --- Utility Functions ---
function normalize(str) {
    if (!str) return "";
    return str.toLowerCase().replace(/critical damage/gi, "crit damage").replace(/critical chance/gi, "crit chance").replace(/critical avoidance/gi, "crit avoid").trim();
}

// --- Selector UI ---
window.renderSelectors = function() {
    const b1 = document.getElementById('box-1');
    const b2 = document.getElementById('box-2');
    const b3 = document.getElementById('box-3');
    if (!b1 || !b2 || !b3) return;

    b1.innerHTML = window.shapes.map(s => `<button class="item-btn ${window.selection.shape === s ? 'active' : ''}" onclick="window.setVal('shape', '${s}')"><span>${s}</span></button>`).join('');
    
    const sortedSets = [...window.rawSets].sort();
    b2.innerHTML = sortedSets.map(s => `<button class="item-btn ${window.selection.sets.includes(s) ? 'active' : ''}" onclick="window.toggleSet('${s}')"><span>${s}</span><img src="img/set_icon_${window.setIconMapping[s]}_32px.png" class="set-icon"></button>`).join('');
    
    const sortedPrimaries = [...window.rawPrimaries].sort();
    b3.innerHTML = sortedPrimaries.map(p => `<button class="item-btn ${window.selection.primary === p ? 'active' : ''}" onclick="window.setVal('primary', '${p}')"><span>${p}</span></button>`).join('');
};

window.setVal = (key, val) => { window.selection[key] = (window.selection[key] === val) ? null : val; window.renderSelectors(); window.renderTable(); };
window.toggleSet = (s) => { 
    if (window.selection.sets.includes(s)) window.selection.sets = window.selection.sets.filter(i => i !== s); 
    else window.selection.sets.push(s); 
    window.renderSelectors(); window.renderTable(); 
};

// --- Table Rendering Engine ---
// AI_LOCK_START
window.renderTable = function() {
    const tbody = document.getElementById('table-body');
    if (!tbody || !window.allUnits) return;

    const query = document.getElementById('character-search').value.toLowerCase();
    const hideG = document.getElementById('hide-greens-check')?.checked;
    const onlyR = document.getElementById('only-reds-check')?.checked;
    const showEq = document.getElementById('show-equipped-check')?.checked;

    let units = window.allUnits.filter(u => u.name.toLowerCase().includes(query));

    // Reverse search filter logic
    units = units.filter(u => {
        let match = true;
        let greenCount = 0, redCount = 0;

        ['square', 'arrow', 'diamond', 'triangle', 'circle', 'cross'].forEach(s => {
            const eq = u[s] || "";
            const rec = (s === 'square') ? "Offense" : (s === 'diamond' ? "Defense" : (u[s + "(r)"] || ""));
            if (!["", "-", "None", "N/A", "?"].includes(eq)) {
                if (normalize(eq).includes(normalize(rec))) greenCount++;
                else redCount++;
            }
        });

        if (hideG && greenCount === 6) return false;
        if (onlyR && redCount === 0) return false;

        if (window.selection.shape || window.selection.sets.length > 0 || window.selection.primary) {
            const targetShape = window.selection.shape ? window.selection.shape.toLowerCase() : null;
            const targetPrimary = window.selection.primary ? normalize(window.selection.primary) : null;
            const targetSets = window.selection.sets.length > 0 ? window.selection.sets.map(s => normalize(s)) : null;

            if (showEq) {
                if (targetShape) {
                    const eqStr = normalize(u[targetShape] || "");
                    if (["", "-", "none"].includes(eqStr)) match = false;
                    if (match && targetPrimary && !eqStr.includes(targetPrimary)) match = false;
                } else if (targetPrimary) {
                    // Exclusionary primary check across all equipped slots when no shape is active
                    const hasPrimaryEq = ['square', 'arrow', 'diamond', 'triangle', 'circle', 'cross'].some(s => normalize(u[s] || "").includes(targetPrimary));
                    if (!hasPrimaryEq) match = false;
                }
                if (match && targetSets) {
                    const eqSet = normalize(u["set"] || "");
                    if (!targetSets.every(s => eqSet.includes(s))) match = false;
                }
            } else {
                // GET MODS MODE: Strict Deficit Check
                if (targetShape) { if (!["", "-", "None", "N/A"].includes(u[targetShape] || "")) match = false; }
                
                if (match && targetSets) {
                    const recCounts = window.getSetCounts(u["set(r)"]);
                    const eqCounts = window.getSetCounts(u.set);

                    for (const sName of targetSets) {
                        const rItem = recCounts.find(r => normalize(r.type) === sName);
                        if (!rItem) { match = false; break; }

                        const eItem = eqCounts.find(e => normalize(e.type) === sName);
                        const eVal = eItem ? eItem.count : 0;
                        
                        if (eVal >= rItem.count) { match = false; break; }
                    }
                }
                
                if (match && targetPrimary) { 
                    if (targetShape) {
                        // Strict check for a single localized slot recommendation
                        const recP = normalize(targetShape === 'square' ? "Offense" : (targetShape === 'diamond' ? "Defense" : (u[targetShape + "(r)"] || ""))); 
                        if (!recP.includes(targetPrimary)) match = false; 
                    } else {
                        // Global exclusionary primary filter check across all recommendation slots
                        const hasPrimaryRec = ['square', 'arrow', 'diamond', 'triangle', 'circle', 'cross'].some(s => {
                            const rec = (s === 'square') ? "Offense" : (s === 'diamond' ? "Defense" : (u[s + "(r)"] || ""));
                            return normalize(rec).includes(targetPrimary);
                        });
                        if (!hasPrimaryRec) match = false;
                    }
                }
            }
        }
        return match;
    });

    // Sorting
    units.sort((a, b) => {
        let vA = a[window.currentSortCol], vB = b[window.currentSortCol];
        return (window.currentSortDir === 'asc') ? (vA > vB ? 1 : -1) : (vA < vB ? 1 : -1);
    });

    // Handle external stats
    if (typeof calculateGameStats === 'function') {
        const stats = calculateGameStats(units, window.allUnits, window.globalHeaderData);
        if (typeof updateOverlayUI === 'function') updateOverlayUI(stats);
    }

    // UPDATE MOD TALLY (Update sub-header with current filtered list)
    if (typeof window.renderModRequirements === 'function') {
        window.renderModRequirements(window.allUnits, 'jvfunc_getmodscount_js');
    }

    tbody.innerHTML = units.map(u => {
        const gearStyle = u.gear.toString().startsWith('R') ? 'text-red-500' : 'text-blue-400';
        const getCell = (slot) => {
            const eq = u[slot] || "";
            let rec = (slot === 'square') ? "Offense" : (slot === 'diamond' ? "Defense" : (u[slot + "(r)"] || ""));
            const isM = (v) => ["", "-", "None", "N/A", "?"].includes(v);
            const dE = isM(eq) ? "N/A" : eq; const dR = isM(rec) ? "N/A" : rec;

            let highlight = "";
            const targetShape = window.selection.shape ? window.selection.shape.toLowerCase() : null;
            const targetPrimary = window.selection.primary ? normalize(window.selection.primary) : null;
            const targetSets = window.selection.sets.length > 0 ? window.selection.sets.map(s => normalize(s)) : null;

            if (window.selection.shape || window.selection.sets.length > 0 || window.selection.primary) {
                let cellMatch = true;
                if (targetShape && slot !== targetShape) cellMatch = false;
                if (showEq) {
                    if (isM(eq)) cellMatch = false;
                    if (cellMatch && targetPrimary && !normalize(eq).includes(targetPrimary)) cellMatch = false;
                    if (cellMatch && targetSets) {
                        const eqSet = normalize(u["set"] || "");
                        if (!targetSets.every(s => eqSet.includes(s))) cellMatch = false;
                    }
                    if (cellMatch) highlight = "is-selector-highlight-equipped";
                } else {
                    if (!isM(eq)) cellMatch = false;
                    if (cellMatch && targetSets) {
                        const unitRecSet = normalize(u["set(r)"]);
                        if (!targetSets.every(s => unitRecSet.includes(s))) cellMatch = false;
                    }
                    if (cellMatch && targetPrimary && !normalize(dR).includes(targetPrimary)) cellMatch = false;
                    if (cellMatch) highlight = "is-selector-highlight";
                }
            }

            if (!isM(eq)) {
                const isPerf = eq.toLowerCase().includes(dR.toLowerCase());
                const statusClass = isPerf ? "mod-perfect" : "mod-missing strike";
                return `<td class="col-${slot} text-center"><div class="cell-flex justify-center"><span class="mod-badge ${statusClass} ${highlight}">${dE}</span>${!isPerf ? `<span class="mod-rec-hint">${dR}</span>` : ''}</div></td>`;
            }
            return `<td class="col-${slot} text-center"><div class="cell-flex justify-center"><span class="mod-badge ${dR === 'N/A' ? 'mod-none' : 'mod-ghost'} ${highlight}">${dR}</span></div></td>`;
        };

        return `<tr onclick="this.classList.toggle('row-selected')">
            <td class="col-name pl-6 font-bold text-slate-200 text-left">${u.name}</td>
            <td class="col-lvl text-slate-500 font-bold text-center">${u.level}</td>
            <td class="col-stars text-amber-600 font-bold text-center">${u.stars}</td>
            <td class="col-gear font-bold border-r border-slate-800/40 ${gearStyle} text-center">${u.gear}</td>
            ${window.getSetCell(u)}
            ${getCell('square')}${getCell('arrow')}${getCell('diamond')}${getCell('triangle')}${getCell('circle')}${getCell('cross')}
        </tr>`;
    }).join('');
};

window.getSetCell = function(u) {
    const recSets = window.getSetCounts(u["set(r)"]);
    const eqSets = window.getSetCounts(u.set);
    if (recSets.length === 0) return `<td class="col-set border-r border-slate-800/40 px-3"><div class="cell-flex"><span class="mod-badge mod-none">N/A</span></div></td>`;
    let html = [];
    let usedE = new Set(), matchedR = new Set();
    recSets.forEach((rec, rIdx) => {
        const eIdx = eqSets.findIndex((e, i) => !usedE.has(i) && e.type.toLowerCase() === rec.type.toLowerCase());
        if (eIdx !== -1) {
            const eq = eqSets[eIdx]; usedE.add(eIdx); matchedR.add(rIdx);
            if (eq.count >= rec.count) html.push(`<span class="mod-badge mod-perfect">${rec.type} ${rec.count}</span>`);
            else html.push(`<span class="mod-set-partial">${rec.type} <span class="partial-num">${eq.count}</span>/${rec.count}</span>`);
        }
    });
    recSets.forEach((rec, rIdx) => {
        if (matchedR.has(rIdx)) return;
        const eIdx = eqSets.findIndex((e, i) => !usedE.has(i));
        if (eIdx !== -1) {
            const wrong = eqSets[eIdx]; usedE.add(eIdx);
            html.push(`<div class="cell-flex"><span class="mod-badge mod-missing strike">${wrong.type} ${wrong.count}</span><span class="mod-rec-hint">${rec.type} ${rec.count}</span></div>`);
        } else html.push(`<span class="mod-badge mod-ghost">${rec.type} ${rec.count}</span>`);
    });
    return `<td class="col-set border-r border-slate-800/40 px-3"><div class="cell-flex">${html.join(' ')}</div></td>`;
};

window.getSetCounts = function(str) {
    const counts = [];
    if (!str || ["-", "None", "N/A"].includes(str)) return counts;
    const setNames = ["Health", "Speed", "Crit Damage", "Crit Chance", "Potency", "Tenacity", "Offense", "Defense"];
    const defaults = { "Speed": 4, "Crit Damage": 4, "Offense": 4, "Health": 2, "Crit Chance": 2, "Potency": 2, "Tenacity": 2, "Defense": 2 };
    setNames.forEach(name => {
        const regex = new RegExp(name + "(?:\\s*\\(?(\\d+)\\)?)?", "gi");
        let match;
        while ((match = regex.exec(str)) !== null) {
            let countVal = match[1] ? parseInt(match[1]) : defaults[name];
            counts.push({ type: name, count: countVal });
        }
    });
    return counts;
};

window.handleHeaderClick = function(key) {
    if (window.currentSortCol === key) window.currentSortDir = window.currentSortDir === 'asc' ? 'desc' : 'asc';
    else { window.currentSortCol = key; window.currentSortDir = 'asc'; }
    window.renderHeader(); window.renderTable();
};

window.renderHeader = function() {
    const row = document.getElementById('table-header-row');
    if (!row) return;
    const cols = [
        { label: 'Unit Name', key: 'name', cls: 'col-name' }, { label: 'Level', key: 'level', cls: 'col-lvl' },
        { label: 'Stars', key: 'stars', cls: 'col-stars' }, { label: 'Gear', key: 'gear', cls: 'col-gear' },
        { label: 'Set', key: 'set', cls: 'col-set' }, { label: 'Square', key: 'square', cls: 'col-square' }, { label: 'Arrow', key: 'arrow', cls: 'col-arrow' },
        { label: 'Diamond', key: 'diamond', cls: 'col-diamond' }, { label: 'Triangle', key: 'triangle', cls: 'col-triangle' }, { label: 'Circle', key: 'circle', cls: 'col-circle' }, { label: 'Cross', key: 'cross', cls: 'col-cross' }
    ];
    row.innerHTML = cols.map(c => {
        const arrow = window.currentSortCol === c.key ? (window.currentSortDir === 'asc' ? ' ▴' : ' ▾') : '';
        const textAlign = c.key === 'name' ? 'text-left pl-6' : 'text-center';
        return `<th class="${c.cls} ${textAlign} py-3 px-3 uppercase text-[11px] font-bold border-b border-slate-800 cursor-pointer" onclick="window.handleHeaderClick('${c.key}')">${c.label}${arrow}</th>`;
    }).join('');
};
// AI_LOCK_END
