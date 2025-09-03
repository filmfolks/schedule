// =================================================================
// --- GLOBAL STATE & DATA STRUCTURE ---
// =================================================================
let projectData = {
    panelItems: [], // Holds both sequences and schedule breaks
    activeItemId: null,
    projectInfo: {}
};
let lastContactPerson = '';
let activeFilter = { type: 'all', value: '' };
let autoSaveInterval = null;

// =================================================================
// --- INITIALIZATION ---
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("ToshooT Script Initializing...");
    setupEventListeners();
    loadProjectData();
    initializeDragAndDrop();
    console.log("Initialization Complete. All functions are now active.");
});

// =================================================================
// --- SETUP ALL EVENT LISTENERS (ROBUST VERSION) ---
// =================================================================
function setupEventListeners() {
    const safeAddListener = (id, event, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener(event, handler);
        } else {
            console.error(`Error: Element with ID '${id}' not found.`);
        }
    };
    
    safeAddListener('schedule-form', 'submit', handleAddScene);

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    if(hamburgerBtn && dropdownMenu) {
        hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('show'); });
    }
    
    safeAddListener('new-project-btn', 'click', openProjectModal);
    safeAddListener('open-project-btn', 'click', () => document.getElementById('file-input').click());
    safeAddListener('file-input', 'change', openProjectFile);
    safeAddListener('new-sequence-btn', 'click', handleNewSequence);
    safeAddListener('save-project-btn', 'click', saveProjectFile);
    safeAddListener('save-excel-btn', 'click', () => saveAsExcel(true));
    safeAddListener('share-project-btn', 'click', shareProject);
    safeAddListener('clear-project-btn', 'click', clearProject);
    safeAddListener('info-btn', 'click', () => document.getElementById('info-modal').style.display = 'block');
    safeAddListener('about-btn', 'click', () => document.getElementById('about-modal').style.display = 'block');
    safeAddListener('auto-save-btn', 'click', toggleAutoSave);

    const sequencePanel = document.getElementById('sequence-panel');
    safeAddListener('sequence-hamburger-btn', 'click', () => sequencePanel.classList.add('open'));
    safeAddListener('close-panel-btn', 'click', () => sequencePanel.classList.remove('open'));
    safeAddListener('add-schedule-break-btn', 'click', handleAddScheduleBreak);
    safeAddListener('export-panel-btn', 'click', () => saveAsExcel(false));
    safeAddListener('filter-by-select', 'change', handleFilterChange);

    safeAddListener('close-project-modal', 'click', closeProjectModal);
    safeAddListener('save-project-info-btn', 'click', handleSaveProjectInfo);
    safeAddListener('close-edit-modal', 'click', closeEditModal);
    safeAddListener('save-changes-btn', 'click', handleSaveChanges);
    safeAddListener('delete-scene-btn', 'click', handleDeleteFromModal);
    safeAddListener('close-info-modal', 'click', () => document.getElementById('info-modal').style.display = 'none');
    safeAddListener('close-about-modal', 'click', () => document.getElementById('about-modal').style.display = 'none');

    document.addEventListener('click', (event) => {
        if (hamburgerBtn && dropdownMenu && dropdownMenu.classList.contains('show') && !hamburgerBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
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
// --- FILTERING LOGIC ---
// =================================================================
function handleFilterChange(e) {
    const filterType = e.target.value;
    document.getElementById('filter-by-select').value = 'all'; 
    if (filterType === 'all') {
        activeFilter = { type: 'all', value: '' };
    } else {
        let filterValue = prompt(`Enter value to filter by ${filterType}:`);
        if (filterValue !== null) {
            activeFilter = { type: filterType, value: filterValue.trim().toLowerCase() };
        } else {
            activeFilter = { type: 'all', value: '' };
        }
    }
    renderSchedule();
}

function getVisibleScenes() {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') return [];
    
    const allScenes = [...activeSequence.scenes];

    if (activeFilter.type === 'all') { return allScenes; }

    return allScenes.filter(scene => {
        const sceneValue = (scene[activeFilter.type] || '').toLowerCase();
        return sceneValue.includes(activeFilter.value);
    });
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
            activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
            if(!activeSequence) return;
        } else { return; }
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
    resetFilter();
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
    
    const scenesToRender = getVisibleScenes();
    
    if (scenesToRender.length === 0 && activeFilter.type !== 'all') {
        container.innerHTML = `<p style="text-align:center; color: #9ca3af;">No scenes match the current filter.</p>`;
    } else {
        scenesToRender.forEach(scene => {
            const stripWrapper = document.createElement('div');
            stripWrapper.className = 'scene-strip-wrapper';
            const statusClass = scene.status.replace(/\s+/g, '-').toLowerCase();
            stripWrapper.innerHTML = `
                <div class="scene-strip" id="scene-strip-${scene.id}">
                    <div class="strip-item"><strong>#${scene.number}</strong></div><div class="strip-item">${scene.heading}</div>
                    <div class="strip-item">${formatDateDDMMYYYY(scene.date)}</div><div class="strip-item">${formatTime12Hour(scene.time)}</div>
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
function saveProjectData(isBackup = false) {
    const key = isBackup ? 'projectData_backup' : 'projectData';
    localStorage.setItem(key, JSON.stringify(projectData));
    if(!isBackup) console.log(`Data saved at ${new Date().toLocaleTimeString()}`);
}

function loadProjectData() {
    let savedData = localStorage.getItem('projectData');
    const backupData = localStorage.getItem('projectData_backup');

    if (!savedData && backupData) {
        if (confirm("No main save data found, but a backup exists. Would you like to restore the backup?")) {
            savedData = backupData;
            localStorage.setItem('projectData', backupData);
        }
    }

    projectData = savedData ? JSON.parse(savedData) : { panelItems: [], activeItemId: null, projectInfo: {} };
    if (!projectData.projectInfo) projectData.projectInfo = {};
    if (!projectData.panelItems) projectData.panelItems = [];
    if (projectData.activeItemId === null && projectData.panelItems.length > 0) {
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
    if (confirm('Are you sure you want to clear the entire project? This will delete all sequences and scenes.')) {
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
        id: sceneId, number: document.getElementById('edit-scene-number').value,
        heading: document.getElementById('edit-scene-heading').value, date: document.getElementById('edit-scene-date').value,
        time: document.getElementById('edit-scene-time').value, type: document.getElementById('edit-scene-type').value,
        location: document.getElementById('edit-scene-location').value, pages: document.getElementById('edit-scene-pages').value,
        duration: document.getElementById('edit-scene-duration').value, status: document.getElementById('edit-scene-status').value,
        cast: document.getElementById('edit-scene-cast').value, equipment: document.getElementById('edit-scene-equipment').value,
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
// --- EXPORT & SHARE & UTILITIES ---
// =================================================================
function saveAsExcel(isFullProject = false) {
    const projectInfo = projectData.projectInfo || {};
    const workbook = XLSX.utils.book_new();

    const createSheet = (scenes, sheetName) => {
        let scheduleBreakName = 'Uncategorized';
        const sequenceIndex = projectData.panelItems.findIndex(item => item.name === sheetName);
        if (sequenceIndex > -1) {
            for (let i = sequenceIndex - 1; i >= 0; i--) {
                if (projectData.panelItems[i].type === 'schedule_break') {
                    scheduleBreakName = projectData.panelItems[i].name;
                    break;
                }
            }
        }
        const header = [
            ["Production:", projectInfo.prodName || 'N/A', "Director:", projectInfo.directorName || 'N/A'],
            ["Contact:", projectInfo.contactNumber || 'N/A', "Email:", projectInfo.contactEmail || 'N/A'], [],
            [`Schedule Break: ${scheduleBreakName}`], [`Sequence: ${sheetName}`], []
        ];
        const formattedScenes = scenes.map(s => ({...s, date: formatDateDDMMYYYY(s.date)}));
        const worksheet = XLSX.utils.aoa_to_sheet(header);
        worksheet['!merges'] = [{ s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }, { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }];
        XLSX.utils.sheet_add_json(worksheet, formattedScenes, { origin: `A${header.length + 1}`, skipHeader: false });
        return worksheet;
    };

    if (isFullProject) {
        projectData.panelItems.forEach(item => {
            if (item.type === 'sequence' && item.scenes.length > 0) {
                const worksheet = createSheet(item.scenes, item.name);
                XLSX.utils.book_append_sheet(workbook, worksheet, item.name.replace(/[/\\?*:[\]]/g, ''));
            }
        });
        if(workbook.SheetNames.length === 0){ alert("No scenes in any sequence to export."); return;}
        XLSX.writeFile(workbook, `${projectInfo.prodName || 'FullProject'}_Schedule.xlsx`);
    } else {
        const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
        if (!activeSequence) { alert("Please select a sequence to export."); return; }
        const scenesToExport = getVisibleScenes();
        if (scenesToExport.length === 0) { alert(`No visible scenes in "${activeSequence.name}" to export.`); return; }
        const worksheet = createSheet(scenesToExport, activeSequence.name);
        XLSX.utils.book_append_sheet(workbook, worksheet, activeSequence.name.replace(/[/\\?*:[\]]/g, ''));
        XLSX.writeFile(workbook, `${activeSequence.name}_Schedule.xlsx`);
    }
}

async function shareProject() { /* ... full function ... */ }
async function shareScene(id) { /* ... full function ... */ }
function formatTime12Hour(timeString) {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(':');
    const hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    const hour12 = hourInt % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
}
function formatDateDDMMYYYY(dateString) {
    if (!dateString || dateString.indexOf('-') === -1) return dateString || "N/A";
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}
function toggleAutoSave() {
    const statusEl = document.getElementById('auto-save-status');
    if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
        autoSaveInterval = null;
        statusEl.textContent = 'OFF';
        statusEl.className = 'auto-save-status off';
        console.log('Auto-save stopped.');
    } else {
        autoSaveInterval = setInterval(() => {
            saveProjectData(false); 
            saveProjectData(true); 
        }, 120000); 
        statusEl.textContent = 'ON';
        statusEl.className = 'auto-save-status on';
        console.log('Auto-save started.');
        alert('Auto-save is now ON. Your project will be saved to this browser\'s storage every 2 minutes.');
    }
}
function resetFilter() {
    activeFilter = { type: 'all', value: '' };
    document.getElementById('filter-by-select').value = 'all';
}
    </script>
</body>
</html>
