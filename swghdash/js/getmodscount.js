// Filename: getmodscount.js
// Updated: 2026-03-08 11:15
// Description: Dynamic tally of mods. Robust parsing and global calculation.

function parseSetToNumbers(str, isRecommended = false) {
    const counts = { "Health": 0, "Speed": 0, "Crit Damage": 0, "Crit Chance": 0, "Potency": 0, "Tenacity": 0, "Offense": 0, "Defense": 0 };
    if (!str || ["-", "None", "N/A"].includes(str)) return counts;

    const setNames = Object.keys(counts);
    // Standardvärden om (siffra) saknas i strängen
    const defaults = { "Speed": 4, "Crit Damage": 4, "Offense": 4, "Health": 2, "Crit Chance": 2, "Potency": 2, "Tenacity": 2, "Defense": 2 };

    setNames.forEach(name => {
        // Letar efter "Namn (Siffra)" ELLER bara "Namn"
        const regex = new RegExp(name + "(?:\\s*\\((\\d+)\\))?", "i");
        const match = str.match(regex);
        
        if (match) {
            if (match[1]) {
                counts[name] = parseInt(match[1]);
            } else {
                // Om namnet finns men ingen siffra (t.ex. bara "Speed"), använd standard
                counts[name] = isRecommended ? defaults[name] : 0; 
                // För utrustade mods (isRecommended = false) räknar vi det som 0 om ingen siffra finns, 
                // såvida inte strängen faktiskt bara innehåller namnet.
                if (!isRecommended && str.toLowerCase().includes(name.toLowerCase())) {
                     counts[name] = defaults[name];
                }
            }
        }
    });
    return counts;
}

// AI_LOCK_START
function renderModRequirements(units, targetId) {
    const container = document.getElementById(targetId);
    if (!container || !units) return;

    const allSets = ["Health", "Speed", "Crit Damage", "Crit Chance", "Potency", "Tenacity", "Offense", "Defense"];
    const tally = {};
    allSets.forEach(s => tally[s] = 0);

    const showEq = document.getElementById('show-equipped-check')?.checked;

    // Vi loopar igenom alla enheter som skickas in
    units.forEach(u => {
        const rec = parseSetToNumbers(u["set(r)"], true);
        const eq = parseSetToNumbers(u.set, false);
        
        allSets.forEach(setName => {
            if (showEq) {
                tally[setName] += (eq[setName] || 0);
            } else {
                const deficit = Math.max(0, (rec[setName] || 0) - (eq[setName] || 0));
                tally[setName] += deficit;
            }
        });
    });

    const html = allSets.sort().map(set => {
        const val = tally[set];
        if (showEq) {
            return `<div class="flex items-center gap-1 px-2 py-1 rounded border-[1.5px] border-dashed border-[#7d838c] opacity-50 h-7 shrink-0">
                <span class="text-[#7d838c] uppercase text-[10px] font-bold">${set}:</span>
                <span class="text-[#7d838c] font-black text-[10px]">${val}</span>
            </div>`;
        } else {
            const numColor = val > 0 ? 'text-yellow-500' : 'text-slate-500';
            return `<div class="flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded border border-slate-800 h-7 shrink-0 ${val > 0 ? 'opacity-100' : 'opacity-40'}">
                <span class="text-slate-400 uppercase text-[10px] font-bold">${set}:</span>
                <span class="${numColor} font-black text-[10px]">${val}</span>
            </div>`;
        }
    }).join('');

    container.innerHTML = `
        <div class="flex items-center justify-end gap-3 shrink-0">
            <span class="${showEq ? 'text-orange-500' : 'text-yellow-600'} font-black text-[10px] whitespace-nowrap uppercase">${showEq ? "Equipped:" : "Get Mods:"}</span>
            <div class="flex flex-row gap-2 flex-nowrap">${html}</div>
        </div>`;
}
// AI_LOCK_END