// =================================================================
// --- GLOBAL STATE & DATA STRUCTURE ---
// =================================================================
let projectData = {
    panelItems: [], // Holds both sequences and schedule breaks
    activeItemId: null,
    projectInfo: {}
};
let lastContactPerson = '';

// =================================================================
// --- INITIALIZATION ---
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("ToshooT Script Initializing...");
    setupEventListeners();
    loadProjectData();
    initializeDragAndDrop();
    const contactInput = document.getElementById('scene-contact');
    if (contactInput) contactInput.value = lastContactPerson;
    console.log("Initialization Complete.");
});

// =================================================================
// --- SETUP ALL EVENT LISTENERS ---
// =================================================================
function setupEventListeners() {
    // Main Form
    document.getElementById('filter-by-select').addEventListener('change', handleFilterChange);

}

    // Left Hamburger Menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('show'); });
    document.getElementById('new-project-btn').addEventListener('click', openProjectModal);
    document.getElementById('open-project-btn').addEventListener('click', () => document.getElementById('file-input').click());
    document.getElementById('file-input').addEventListener('change', openProjectFile);
    document.getElementById('new-sequence-btn').addEventListener('click', handleNewSequence);
    document.getElementById('save-project-btn').addEventListener('click', saveProjectFile);
    document.getElementById('save-excel-btn').addEventListener('click', saveAsExcel);
    document.getElementById('share-project-btn').addEventListener('click', shareProject);
    document.getElementById('clear-project-btn').addEventListener('click', clearProject);
    document.getElementById('info-btn').addEventListener('click', () => document.getElementById('info-modal').style.display = 'block');
    document.getElementById('about-btn').addEventListener('click', () => document.getElementById('about-modal').style.display = 'block');

    // Right Sequence Panel
    const sequencePanel = document.getElementById('sequence-panel');
    document.getElementById('sequence-hamburger-btn').addEventListener('click', () => sequencePanel.classList.add('open'));
    document.getElementById('close-panel-btn').addEventListener('click', () => sequencePanel.classList.remove('open'));
    document.getElementById('add-schedule-break-btn').addEventListener('click', handleAddScheduleBreak);
    document.getElementById('export-panel-btn').addEventListener('click', saveAsExcel);
    document.getElementById('sort-by-select').addEventListener('change', (e) => sortActiveSequence(e.target.value));

    // Modals Close Buttons
    document.getElementById('close-project-modal').addEventListener('click', closeProjectModal);
    document.getElementById('save-project-info-btn').addEventListener('click', handleSaveProjectInfo);
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('save-changes-btn').addEventListener('click', handleSaveChanges);
    document.getElementById('delete-scene-btn').addEventListener('click', handleDeleteFromModal);
    document.getElementById('close-info-modal').addEventListener('click', () => document.getElementById('info-modal').style.display = 'none');
    document.getElementById('close-about-modal').addEventListener('click', () => document.getElementById('about-modal').style.display = 'none');

    // Global click listener to close dropdowns
    document.addEventListener('click', (event) => {
        if (dropdownMenu.classList.contains('show') && !hamburgerBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

// =================================================================
// --- NEW: FILTERING LOGIC ---
// =================================================================

function handleFilterChange(e) {
    const filterType = e.target.value;
    if (filterType === 'all') {
        activeFilter = { type: 'all', value: '' };
        renderSchedule(); // Render all scenes
    } else {
        let filterValue = prompt(`Enter value to filter by ${filterType}:`);
        if (filterValue !== null && filterValue.trim() !== "") {
            activeFilter = { type: filterType, value: filterValue.trim().toLowerCase() };
            renderSchedule(); // Render filtered scenes
        }
    }
    // Reset dropdown if user cancels prompt
    e.target.value = 'all';
}

function getVisibleScenes() {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') {
        return []; // Return empty array if no active sequence
    }
    
    const allScenes = activeSequence.scenes;

    if (activeFilter.type === 'all') {
        return allScenes;
    }

    return allScenes.filter(scene => {
        const sceneValue = (scene[activeFilter.type] || '').toLowerCase();
        return sceneValue.includes(activeFilter.value);
    });
}

// =================================================================
// --- CORE SCHEDULE FUNCTIONS (ADAPTED FOR FILTERING) ---
// =================================================================

function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    const display = document.getElementById('active-sequence-display');
    container.innerHTML = '';
    
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    
    if (!activeSequence || activeSequence.type !== 'sequence') {
        display.textContent = 'No active sequence. Create or select a sequence.';
        return;
    }

    display.textContent = `Current Sequence: ${activeSequence.name}`;
    
    const scenesToRender = getVisibleScenes(); // Get either all or filtered scenes
    
    if (scenesToRender.length === 0) {
        const message = document.createElement('p');
        message.textContent = "No scenes match the current filter.";
        message.style.textAlign = 'center';
        container.appendChild(message);
    } else {
        scenesToRender.forEach(scene => {
            // ... (The code to create and append the detailed strip wrapper is the same)
        });
    }
}

function handleAddScene(e) {
    e.preventDefault();
    // ... (logic to get/create active sequence)
    
    const newScene = { /* ... (get data from form) ... */ };
    activeSequence.scenes.push(newScene);
    // ... (save data, reset form)
    
    // After adding, re-render with the current filter applied
    renderSchedule();
}

function deleteScene(id) {
    // ... (logic to find active sequence and filter out the scene)
    saveProjectData();
    renderSchedule(); // Re-render with the current filter applied
}




// =================================================================
// --- DRAG-AND-DROP INITIALIZATION ---
// =================================================================
function initializeDragAndDrop() {
    const listContainer = document.getElementById('sequence-list');
    if(listContainer){
        new Sortable(listContainer, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: (evt) => {
                const item = projectData.panelItems.splice(evt.oldIndex, 1)[0];
                projectData.panelItems.splice(evt.newIndex, 0, item);
                saveProjectData();
            }
        });
    }
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
    if (!listContainer) return;
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

function sortActiveSequence(sortBy) {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || sortBy === 'default') return;
    activeSequence.scenes.sort((a, b) => {
        const valA = (a[sortBy] || '').toUpperCase();
        const valB = (b[sortBy] || '').toUpperCase();
        if (valA < valB) return -1;
        if (valA > valB) return 1;
        return 0;
    });
    saveProjectData();
    renderSchedule();
}

// =================================================================
// --- CORE SCHEDULE FUNCTIONS ---
// =================================================================
function handleAddScene(e) {
    e.preventDefault();
    let activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') {
        if (confirm("No sequence created. Would you like to create 'Sequence 1' to add this scene?")) {
            handleNewSequence();
            // We need to re-find the active sequence after it's created
            activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
            if(!activeSequence) return; // Exit if user cancelled the new sequence prompt
        } else {
            return;
        }
    }
    const newScene = {
        id: Date.now(), number: document.getElementById('scene-number').value,
        heading: document.getElementById('scene-heading').value, date: document.getElementById('scene-date').value,
        time: document.getElementById('scene-time').value, type: document.getElementById('scene-type').value,
        location: document.getElementById('scene-location').value, pages: document.getElementById('scene-pages').value,
        duration: document.getElementById('scene-duration').value, status: document.getElementById('scene-status').value,
        cast: document.getElementById('scene-cast').value, equipment: document.getElementById('scene-equipment').value,
        contact: document.getElementById('scene-contact').value,
    };
    activeSequence.scenes.push(newScene);
    lastContactPerson = newScene.contact;
    saveProjectData();
    renderSchedule();
    e.target.reset();
    document.getElementById('scene-contact').value = lastContactPerson;
}

function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    const display = document.getElementById('active-sequence-display');
    container.innerHTML = '';
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') {
        display.textContent = 'No active sequence. Create or select a sequence.';
        return;
    }
    display.textContent = `Current Sequence: ${activeSequence.name}`;
    activeSequence.scenes.forEach(scene => {
        const stripWrapper = document.createElement('div');
        stripWrapper.className = 'scene-strip-wrapper';
        const statusClass = scene.status.replace(/\s+/g, '-').toLowerCase();
        stripWrapper.innerHTML = `
            <div class="scene-strip" id="scene-strip-${scene.id}">
                <div class="strip-item"><strong>#${scene.number}</strong></div><div class="strip-item">${scene.heading}</div>
                <div class="strip-item">${scene.date}</div><div class="strip-item">${scene.time}</div>
                <div class="strip-item">${scene.type}. ${scene.location}</div>
                <div class="strip-item">Pages: <strong>${scene.pages || 'N/A'}</strong></div>
                <div class="strip-item">Duration: <strong>${scene.duration || 'N/A'}</strong></div>
                <div class="strip-item">Cast: <strong>${scene.cast || 'N/A'}</strong></div>
                <div class="strip-item">Equipment: <strong>${scene.equipment || 'N/A'}</strong></div>
                <div class="strip-item"><span class="strip-status ${statusClass}">${scene.status}</span></div>
            </div>
            <div class="scene-actions">
                <button class="edit-btn-strip" title="Edit Scene"><i class="fas fa-pencil-alt"></i></button>
                <button class="share-btn-strip" title="Share as Image"><i class="fas fa-share-alt"></i></button>
            </div>
        `;
        stripWrapper.querySelector('.edit-btn-strip').addEventListener('click', () => openEditModal(scene.id));
        stripWrapper.querySelector('.share-btn-strip').addEventListener('click', () => shareScene(scene.id));
        container.appendChild(stripWrapper);
    });
}

function deleteScene(id) {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence) return;
    activeSequence.scenes = activeSequence.scenes.filter(scene => scene.id !== id);
    saveProjectData();
    renderSchedule();
}

// =================================================================
// --- DATA PERSISTENCE & PROJECT FILES ---
// =================================================================
function saveProjectData() { localStorage.setItem('projectData', JSON.stringify(projectData)); }

function loadProjectData() {
    const savedData = localStorage.getItem('projectData');
    projectData = savedData ? JSON.parse(savedData) : { panelItems: [], activeItemId: null, projectInfo: {} };
    if (!projectData.projectInfo) projectData.projectInfo = {};
    if (!projectData.panelItems) projectData.panelItems = [];
    if (!projectData.activeItemId && projectData.panelItems.length > 0) {
        const firstSequence = projectData.panelItems.find(i => i.type === 'sequence');
        if (firstSequence) projectData.activeItemId = firstSequence.id;
    }
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (activeSequence && activeSequence.scenes && activeSequence.scenes.length > 0) {
        lastContactPerson = activeSequence.scenes[activeSequence.scenes.length - 1].contact || '';
    }
    renderSchedule();
    renderSequencePanel();
}

function clearProject() {
    if (confirm('Are you sure you want to clear the entire project?')) {
        projectData = { panelItems: [], activeItemId: null, projectInfo: {} };
        lastContactPerson = '';
        saveProjectData();
        renderSchedule();
        renderSequencePanel();
    }
}

function saveProjectFile() {
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectData.projectInfo.prodName || 'Schedule'}.filmproj`;
    a.click();
    URL.revokeObjectURL(url);
}

function openProjectFile(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const loadedData = JSON.parse(e.target.result);
            if (loadedData && loadedData.panelItems && loadedData.hasOwnProperty('activeItemId')) {
                projectData = loadedData;
                saveProjectData();
                alert('Project loaded successfully!');
                loadProjectData();
            } else { alert('Error: Invalid project file format.'); }
        } catch (error) { alert('Error: Could not read project file.'); }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// =================================================================
// --- MODAL LOGIC ---
// =================================================================
function openProjectModal() {
    const projectInfo = projectData.projectInfo || {};
    document.getElementById('prod-name').value = projectInfo.prodName || '';
    document.getElementById('director-name').value = projectInfo.directorName || '';
    document.getElementById('contact-number').value = projectInfo.contactNumber || '';
    document.getElementById('contact-email').value = projectInfo.contactEmail || '';
    document.getElementById('project-info-modal').style.display = 'block';
}

function closeProjectModal() { document.getElementById('project-info-modal').style.display = 'none'; }

function handleSaveProjectInfo() {
    projectData.projectInfo = {
        prodName: document.getElementById('prod-name').value, directorName: document.getElementById('director-name').value,
        contactNumber: document.getElementById('contact-number').value, contactEmail: document.getElementById('contact-email').value
    };
    saveProjectData();
    closeProjectModal();
}

function openEditModal(id) {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence) return;
    const scene = activeSequence.scenes.find(s => s.id === id);
    if (!scene) return;
    document.getElementById('edit-scene-id').value = scene.id;
    document.getElementById('edit-scene-number').value = scene.number;
    document.getElementById('edit-scene-heading').value = scene.heading;
    document.getElementById('edit-scene-date').value = scene.date;
    document.getElementById('edit-scene-time').value = scene.time;
    document.getElementById('edit-scene-type').value = scene.type;
    document.getElementById('edit-scene-location').value = scene.location;
    document.getElementById('edit-scene-pages').value = scene.pages;
    document.getElementById('edit-scene-duration').value = scene.duration;
    document.getElementById('edit-scene-status').value = scene.status;
    document.getElementById('edit-scene-cast').value = scene.cast;
    document.getElementById('edit-scene-equipment').value = scene.equipment;
    document.getElementById('edit-scene-contact').value = scene.contact;
    document.getElementById('edit-scene-modal').style.display = 'block';
}

function closeEditModal() { document.getElementById('edit-scene-modal').style.display = 'none'; }

function handleSaveChanges() {
    const sceneId = parseInt(document.getElementById('edit-scene-id').value);
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence) return;
    const sceneIndex = activeSequence.scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    activeSequence.scenes[sceneIndex] = {
        id: sceneId,
        number: document.getElementById('edit-scene-number').value,
        heading: document.getElementById('edit-scene-heading').value,
        date: document.getElementById('edit-scene-date').value,
        time: document.getElementById('edit-scene-time').value,
        type: document.getElementById('edit-scene-type').value,
        location: document.getElementById('edit-scene-location').value,
        pages: document.getElementById('edit-scene-pages').value,
        duration: document.getElementById('edit-scene-duration').value,
        status: document.getElementById('edit-scene-status').value,
        cast: document.getElementById('edit-scene-cast').value,
        equipment: document.getElementById('edit-scene-equipment').value,
        contact: document.getElementById('edit-scene-contact').value
    };
    saveProjectData();
    renderSchedule();
    closeEditModal();
}

function handleDeleteFromModal() {
    const sceneId = parseInt(document.getElementById('edit-scene-id').value);
    deleteScene(sceneId);
    closeEditModal();
}

// =================================================================
// --- EXPORT & SHARE FUNCTIONS (UPDATED EXCEL EXPORT) ---
// =================================================================

function saveAsExcel() {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') { alert("Please select a sequence to export."); return; }

    // UPDATED: Use the getVisibleScenes function to get the data to export
    const scenesToExport = getVisibleScenes();
    const sequenceName = activeSequence.name;

    if (scenesToExport.length === 0) {
        alert(`No visible scenes in "${sequenceName}" to export.`);
        return;
    }

    // Find the schedule break for this sequence
    let scheduleBreakName = 'Uncategorized';
    const sequenceIndex = projectData.panelItems.findIndex(item => item.id === projectData.activeItemId);
    for (let i = sequenceIndex - 1; i >= 0; i--) {
        if (projectData.panelItems[i].type === 'schedule_break') {
            scheduleBreakName = projectData.panelItems[i].name;
            break;
        }
    }
    
    const projectInfo = projectData.projectInfo || {};
    const header = [
        ["Production:", projectInfo.prodName || 'N/A', "Director:", projectInfo.directorName || 'N/A'],
        ["Contact:", projectInfo.contactNumber || 'N/A', "Email:", projectInfo.contactEmail || 'N/A'],
        [], // Empty spacer row
        [`Schedule Break: ${scheduleBreakName}`],
        [`Sequence: ${sequenceName}`],
        [] // Empty spacer row
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(header);
    worksheet['!merges'] = [{ s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }];
    
    XLSX.utils.sheet_add_json(worksheet, scenesToExport, {
        origin: `A${header.length + 1}`, // Start data after the header
        skipHeader: false
    });
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sequenceName.replace(/[/\\?*:[\]]/g, ''));
    XLSX.writeFile(workbook, `${sequenceName}_Schedule.xlsx`);
}

// --- All other functions (Data Persistence, Modals, Drag-and-Drop, etc.) remain the same ---
