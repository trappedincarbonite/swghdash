/* Filename: gamestats.js */
/* Updated: 2026-03-07 11:15 */
/* Description: Logic for rendering player account stats. 
   Outputs data to a target ID following the jvfunc_[filename]_js convention. */

/**
 * Formats numbers with spaces as thousands separators.
 * @param {number|string} num - The raw number.
 * @returns {string} Formatted string (e.g., "8 500 000").
 */
const formatAccountNum = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") || "0";
};

/**
 * Renders account-wide statistics into a specified container.
 * @param {Object} headerData - The raw header object from swgoh_data.json.
 * @param {string} targetId - The ID of the HTML element to update (e.g., 'jvfunc_gamestats_js').
 */
function renderAccountStats(headerData, targetId) {
    const container = document.getElementById(targetId);
    if (!container || !headerData) return;

    // Mapping raw JSON keys to variables
    const gp = formatAccountNum(headerData['galactic power']);
    const charGp = formatAccountNum(headerData['characters gp']);
    const fleetGp = formatAccountNum(headerData['fleet gp']);
    const arena = headerData['arena rank'] || "N/A";
    const fleet = headerData['fleet rank'] || "N/A";

    // Build the UI string with amber/slate styling and pipe separators
    // The whitespace-nowrap ensures it stays on one line regardless of where it's placed.
    container.innerHTML = `
        
    <div class="flex items-center gap-5 text-[10px] font-bold uppercase tracking-wide whitespace-nowrap">
            <div>
                <span class="text-amber-500">GALACTIC POWER</span> 
                <span class="text-slate-400 font-normal ml-1">PLAYER</span> <span class="text-amber-500 ml-1">${gp}</span>
                <span class="text-slate-400 font-normal ml-1">CHARACTERS</span> <span class="text-amber-500 ml-1">${charGp}</span>
                <span class="text-slate-400 font-normal ml-1">SHIPS</span> <span class="text-amber-500 ml-1">${fleetGp}</span>
            </div>
            <span class="text-slate-700">|</span>
            <div>
                <span class="text-amber-500">RANK</span> 
                <span class="text-slate-400 font-normal ml-1">ARENA</span> <span class="text-amber-500 ml-1">${arena}</span>
                <span class="text-slate-400 font-normal ml-2">FLEET</span> <span class="text-amber-500 ml-1">${fleet}</span>
            </div>
            <span class="text-slate-600">|</span>
        </div>`;
}

// Ensure the function is accessible to other scripts
window.renderAccountStats = renderAccountStats;