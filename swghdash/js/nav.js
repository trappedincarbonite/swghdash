/* Filename: nav.js */
/* Updated: 2026-03-03 16:44:12 */
/* Description: Global navigation logic with absolute path matching for active link highlighting. */

document.addEventListener('DOMContentLoaded', () => {
    const menuContainer = document.getElementById('menu-links');
    if (!menuContainer) return;

    // Detect if the current page is within the /html/ directory
    const path = window.location.pathname;
    const isInsideHtmlFolder = path.includes('/html/');
    
    // Get the current file name, default to index.html if at root
    const segments = path.split('/').filter(Boolean);
    let currentPage = segments.pop() || 'index.html';
    if (!currentPage.includes('.')) currentPage = 'index.html'; // Handle trailing slashes

    // Define all menu items
    const menuItems = [
        { name: 'DASHBOARD', path: 'index.html', isRoot: true },
   /*     { name: 'OVERLAY', path: 'html/overlay.html', isRoot: false }, */
   /*     { name: 'FINDER', path: 'html/finder.html', isRoot: false }, */
        { name: 'KYRO', path: 'html/kyro.html', isRoot: false },
		{ name: 'SELL MODS', path: 'html/sellmods.html', isRoot: false },
   /*     { name: '(SHIPMENTS)', path: 'html/shipments.html', isRoot: false }, */
        { name: 'FARMGUIDE', path: 'html/farmguide.html', isRoot: false }
   /*     { name: '(LST)', path: 'html/lst.html', isRoot: false }, */
   /*     { name: 'PORTRAITS', path: 'html/portraits.html', isRoot: false }, */
   /*     { name: 'TEMPLATE', path: 'html/template.html', isRoot: false } */
    ];

    menuContainer.innerHTML = '';

    menuItems.forEach((item, index) => {
        const link = document.createElement('a');
        const targetFile = item.path.split('/').pop();
        
        // Resolve paths based on current location
        let finalPath = '';
        if (isInsideHtmlFolder) {
            finalPath = item.isRoot ? '../' + item.path : targetFile;
        } else {
            finalPath = item.path;
        }

        // Matching logic: Case-insensitive and clean
        const isActive = currentPage.toLowerCase() === targetFile.toLowerCase();

        link.href = finalPath;
        link.textContent = item.name;
        
        // Styling: Use !important to ensure Tailwind overrides style.css
        // Using amber-500 for the signature SWGOH look
        link.className = isActive 
            ? '!text-amber-500 font-black tracking-widest pointer-events-none' 
            : 'text-slate-400 hover:text-white transition-colors uppercase tracking-widest font-bold';
        
        link.style.fontSize = '11px';
        
        menuContainer.appendChild(link);

        // Add separator pipe
        if (index < menuItems.length - 1) {
            const separator = document.createElement('span');
            separator.textContent = '|';
            separator.className = 'mx-3 text-slate-800 cursor-default select-none font-light';
            menuContainer.appendChild(separator);
        }
    });
});