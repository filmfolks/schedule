// =================================================================
// --- GLOBAL STATE & DATA STRUCTURE ---
// =================================================================
let projectData = {
    panelItems: [], // NEW: Holds both sequences and schedule breaks
    activeItemId: null,
    projectInfo: {}
};
let lastContactPerson = '';

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadProjectData();
    initializeDragAndDrop();
});

// =================================================================
// --- NEW: DRAG-AND-DROP INITIALIZATION ---
// =================================================================
function initializeDragAndDrop() {
    const listContainer = document.getElementById('sequence-list');
    new Sortable(listContainer, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        onEnd: (evt) => {
            // Reorder the projectData.panelItems array based on the drag event
            const item = projectData.panelItems.splice(evt.oldIndex, 1)[0];
            projectData.panelItems.splice(evt.newIndex, 0, item);
            saveProjectData();
        }
    });
}

// =================================================================
// --- SEQUENCE & SCHEDULE BREAK MANAGEMENT ---
// =================================================================
function handleNewSequence() {
    let name = prompt("Enter a name for the new sequence:");
    if (name === null) return;
    if (name.trim() === "") name = `Sequence ${projectData.panelItems.filter(i => i.type === 'sequence').length + 1}`;
    
    const newItem = { type: 'sequence', id: Date.now(), name: name, scenes: [] };
    projectData.panelItems.push(newItem);
    setActiveItem(newItem.id);
}

function handleAddScheduleBreak() {
    let name = prompt("Enter a name for the schedule break (e.g., DAY 1):");
    if (name === null || name.trim() === "") return;
    
    const newItem = { type: 'schedule_break', id: Date.now(), name: name };
    projectData.panelItems.push(newItem);
    saveProjectData();
    renderSequencePanel();
}

function setActiveItem(id) {
    const item = projectData.panelItems.find(i => i.id === id);
    if (item && item.type === 'sequence') {
        projectData.activeItemId = id;
        saveProjectData();
        renderSchedule();
        renderSequencePanel();
        document.getElementById('sequence-panel').classList.remove('open');
    }
}

function renderSequencePanel() {
    const listContainer = document.getElementById('sequence-list');
    listContainer.innerHTML = '';
    projectData.panelItems.forEach(item => {
        const element = document.createElement('div');
        if (item.type === 'sequence') {
            element.className = `sequence-item ${item.id === projectData.activeItemId ? 'active' : ''}`;
            element.textContent = item.name;
            element.onclick = () => setActiveItem(item.id);
        } else if (item.type === 'schedule_break') {
            element.className = 'schedule-break-item';
            element.textContent = item.name;
        }
        listContainer.appendChild(element);
    });
}

// =================================================================
// --- CORE SCHEDULE FUNCTIONS (ADAPTED FOR NEW DATA STRUCTURE) ---
// =================================================================
function handleAddScene(e) {
    e.preventDefault();
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);

    if (!activeSequence || activeSequence.type !== 'sequence') {
        alert("Please select or create a sequence before adding scenes.");
        return;
    }

    const newScene = { id: Date.now(), /* ... all form fields ... */ };
    activeSequence.scenes.push(newScene);
    // ... rest of function (save, render, reset form) ...
}

function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    const display = document.getElementById('active-sequence-display');
    container.innerHTML = '';
    
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    
    if (!activeSequence || activeSequence.type !== 'sequence') {
        display.textContent = 'No active sequence.';
        return;
    }

    display.textContent = `Current Sequence: ${activeSequence.name}`;
    activeSequence.scenes.forEach(scene => {
        // ... (The code to create the detailed strip wrapper is the same) ...
    });
}

// =================================================================
// --- DATA PERSISTENCE (localStorage for new structure) ---
// =================================================================
function saveProjectData() { localStorage.setItem('projectData', JSON.stringify(projectData)); }

function loadProjectData() {
    const savedData = localStorage.getItem('projectData');
    projectData = savedData ? JSON.parse(savedData) : { panelItems: [], activeItemId: null, projectInfo: {} };
    if (!projectData.projectInfo) projectData.projectInfo = {};
    if (!projectData.panelItems) projectData.panelItems = [];
    
    // Auto-select the first sequence if none is active
    if (!projectData.activeItemId && projectData.panelItems.length > 0) {
        const firstSequence = projectData.panelItems.find(i => i.type === 'sequence');
        if (firstSequence) projectData.activeItemId = firstSequence.id;
    }
    
    // ... (logic to get lastContactPerson) ...
    renderSchedule();
    renderSequencePanel();
}

// =================================================================
// --- EXPORT & SHARE FUNCTIONS (Updated) ---
// =================================================================
function saveAsExcel() {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') { alert("Please select a sequence to export."); return; }

    const projectInfo = projectData.projectInfo || {};
    const header = [
        ["Production:", projectInfo.prodName || 'N/A', "Director:", projectInfo.directorName || 'N/A'],
        ["Contact:", projectInfo.contactNumber || 'N/A', "Email:", projectInfo.contactEmail || 'N/A']
    ];
    // Add an empty row for spacing
    header.push([]);

    const worksheet = XLSX.utils.aoa_to_sheet(header);
    // Merge header cells
    worksheet['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }, // Merge cells for Production Name
        { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }  // Merge cells for Contact
    ];
    
    XLSX.utils.sheet_add_json(worksheet, activeSequence.scenes, { origin: "A4", skipHeader: false });
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, activeSequence.name);
    XLSX.writeFile(workbook, `${activeSequence.name}_Schedule.xlsx`);
}

async function shareScene(id) {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence) return;
    
    const scene = activeSequence.scenes.find(s => s.id === id);
    const projectInfo = projectData.projectInfo || {};    
    let footerHtml = `<div class="footer-project-info">
            ${projectInfo.prodName ? `<div>${projectInfo.prodName}</div>` : ''}
            ${projectInfo.directorName ? `<div>Dir: ${projectInfo.directorName}</div>` : ''}
        </div><div class="footer-brand">@Thosho Tech</div>`;

    template.innerHTML = `<div class="share-card-content">
            <div class="share-card-header"><h1>Scene #${scene.number}</h1><h2>${scene.heading}</h2></div>
            <p class="share-card-item"><strong>Date:</strong> ${scene.date}</p>
            <p class="share-card-item"><strong>Time:</strong> ${formatTime12Hour(scene.time)}</p>
            <p class="share-card-item"><strong>Location:</strong> ${scene.type}. ${scene.location}</p>
            <p class="share-card-item"><strong>Cast:</strong> ${scene.cast || 'N/A'}</p>
            <p class="share-card-item"><strong>Contact:</strong> 📞 ${scene.contact || 'N/A'}</p>
            <div class="share-card-footer">${footerHtml}</div></div>`;

    try {
        const canvas = await html2canvas(template, { scale: 2 });
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], `scene_${scene.number}.png`, { type: 'image/png' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: `Shooting Schedule - Scene ${scene.number}` });
        } else {
            const imgUrl = URL.createObjectURL(blob);
            window.open(imgUrl, '_blank');
        }
    } catch (error) { console.error('Sharing failed:', error); }
}

function formatTime12Hour(timeString) {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(':');
    const hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    const hour12 = hourInt % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
}
