// Filename: getmodscount.js
// Updated: 2026-03-07 19:10
// Description: Dynamic tally of mods. Shows deficit (Needed) in normal mode, and total equipped in "Show Equipped" mode.

/**
 * Helper to parse set strings into numeric count objects.
 */
function parseSetToNumbers(str, isRecommended = false) {
    const counts = {};
    if (!str || ["-", "None", "N/A"].includes(str)) return counts;

    const setNames = ["Health", "Speed", "Crit Damage", "Crit Chance", "Potency", "Tenacity", "Offense", "Defense"];
    const defaults = { "Speed": 4, "Crit Damage": 4, "Offense": 4, "Health": 2, "Crit Chance": 2, "Potency": 2, "Tenacity": 2, "Defense": 2 };

    setNames.forEach(name => {
        const regex = new RegExp(name + "(?:\\s*\\(?(\\d+)\\)?)?", "gi");
        let match;
        while ((match = regex.exec(str)) !== null) {
            let countVal = match[1] ? parseInt(match[1]) : (isRecommended ? defaults[name] : 0);
            if (!match[1] && !isRecommended) {
                const occurrences = (str.match(new RegExp(name, "gi")) || []).length;
                countVal = occurrences * 2; 
            }
            counts[name] = (counts[name] || 0) + countVal;
        }
    });
    return counts;
}

// AI_LOCK_START
/**
 * Renders the mod tally based on the current table view and toggle state.
 */
function renderModRequirements(units, targetId) {
    const container = document.getElementById(targetId);
    if (!container || !units) return;

    const allSets = ["Health", "Speed", "Crit Damage", "Crit Chance", "Potency", "Tenacity", "Offense", "Defense"];
    const tally = {};
    allSets.forEach(s => tally[s] = 0);

    const showEq = document.getElementById('show-equipped-check')?.checked;

    units.forEach(u => {
        const rec = parseSetToNumbers(u["set(r)"], true);
        const eq = parseSetToNumbers(u.set, false);
        
        allSets.forEach(setName => {
            if (showEq) {
                // REVERSE MODE: Count total equipped mods for visible units
                tally[setName] += (eq[setName] || 0);
            } else {
                // NORMAL MODE: Count the deficit (what is still needed)
                const deficit = Math.max(0, (rec[setName] || 0) - (eq[setName] || 0));
                tally[setName] += deficit;
            }
        });
    });

    const html = allSets.sort().map(set => {
        const val = tally[set];
        
        if (showEq) {
            // GHOST STYLE: Used for "Show Equipped" view
            // Even with non-zero values, we use ghost styling to distinguish the mode
            return `
                <div class="flex items-center gap-1 px-2 py-1 rounded border-[1.5px] border-dashed border-[#7d838c] opacity-50 h-7 shrink-0">
                    <span class="text-[#7d838c] uppercase text-[10px] font-bold">${set}:</span>
                    <span class="text-[#7d838c] font-black text-[10px]">${val}</span>
                </div>`;
        } else {
            // NORMAL STYLE: Deficit view
            const numColor = val > 0 ? 'text-yellow-500' : 'text-slate-500';
            const borderStyle = val > 0 ? 'border-slate-700' : 'border-slate-800';
            const opacityClass = val > 0 ? 'opacity-100' : 'opacity-40';
            
            return `
                <div class="flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded border ${borderStyle} h-7 shrink-0 ${opacityClass}">
                    <span class="text-slate-400 uppercase text-[10px] font-bold">${set}:</span>
                    <span class="${numColor} font-black text-[10px]">${val}</span>
                </div>`;
        }
    }).join('');

    // Update label text based on mode
    const labelText = showEq ? "EQUIPPED:" : "GET MODS:";
    const labelColor = showEq ? "text-orange-500" : "text-yellow-600";

    container.innerHTML = `
        <div class="flex items-center justify-end gap-3 shrink-0">
            <span class="${labelColor} font-black text-[10px] whitespace-nowrap">${labelText}</span>
            <div class="flex flex-row gap-2 flex-nowrap">${html}</div>
        </div>
    `;
}
// AI_LOCK_END

window.renderModRequirements = renderModRequirements;