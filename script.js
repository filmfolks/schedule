// =================================================================
// --- GLOBAL STATE & DATA STRUCTURE ---
// =================================================================
let projectData = {
    panelItems: [],
    activeItemId: null,
    projectInfo: {}
};
let lastContactPerson = '';
let activeFilter = { type: 'all', value: '' };
let autoSaveInterval = null;

// NEW: State for pagination
let currentPage = 1;
const scenesPerPage = 10;

// =================================================================
// --- INITIALIZATION ---
// =================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("ToshooT Script Initializing...");
    setupEventListeners();
    loadProjectData();
    initializeDragAndDrop();
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
    
    const addDropdownListener = (id, handler) => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', (e) => {
                e.preventDefault();
                handler(e);
                document.getElementById('dropdown-menu').classList.remove('show');
            });
        } else {
            console.error(`Error: Dropdown element with ID '${id}' not found.`);
        }
    };

    safeAddListener('schedule-form', 'submit', handleAddScene);

    const hamburgerBtn = document.getElementById('hamburger-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    if(hamburgerBtn && dropdownMenu) {
        hamburgerBtn.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('show'); });
    }
    
    addDropdownListener('new-project-btn', openProjectModal);
    addDropdownListener('open-project-btn', () => document.getElementById('file-input').click());
    addDropdownListener('new-sequence-btn', handleNewSequence);
    addDropdownListener('save-project-btn', saveProjectFile);
    addDropdownListener('save-excel-btn', () => saveAsExcel(true));
    addDropdownListener('share-project-btn', shareProject);
    addDropdownListener('clear-project-btn', clearProject);
    addDropdownListener('info-btn', () => document.getElementById('info-modal').style.display = 'block');
    addDropdownListener('about-btn', () => document.getElementById('about-modal').style.display = 'block');
    
    const autoSaveBtn = document.getElementById('auto-save-btn');
    if(autoSaveBtn) autoSaveBtn.addEventListener('click', (e) => { e.preventDefault(); toggleAutoSave(); });

    safeAddListener('file-input', 'change', openProjectFile);

    const sequencePanel = document.getElementById('sequence-panel');
    safeAddListener('sequence-hamburger-btn', 'click', () => sequencePanel.classList.add('open'));
    safeAddListener('close-panel-btn', 'click', () => sequencePanel.classList.remove('open'));
    safeAddListener('add-schedule-break-btn', 'click', handleAddScheduleBreak);
    safeAddListener('export-panel-btn', 'click', () => saveAsExcel(false));
    safeAddListener('filter-by-select', 'change', (e) => {
        currentPage = 1; // Reset to first page on filter change
        handleFilterChange(e);
    });

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

function handleEditItem(id) {
    const item = projectData.panelItems.find(i => i.id === id);
    if (!item) return;

    const newName = prompt("Enter the new name:", item.name);

    if (newName !== null && newName.trim() !== "") {
        item.name = newName.trim();
        saveProjectData();
        renderSequencePanel(); 
        renderSchedule();    
    }
}


function setActiveItem(id) {
    const item = projectData.panelItems.find(i => i.id === id);
    if (item && item.type === 'sequence') {
        projectData.activeItemId = id;
        currentPage = 1; // Reset to page 1 when switching sequences
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
        const itemName = document.createElement('span');
        itemName.className = 'panel-item-name';
        itemName.textContent = item.name;

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-item-btn';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i>';
        editBtn.title = 'Edit Name';
        editBtn.onclick = (e) => {
            e.stopPropagation(); 
            handleEditItem(item.id);
        };

        if (item.type === 'sequence') {
            element.className = `sequence-item ${item.id === projectData.activeItemId ? 'active' : ''}`;
            element.onclick = () => setActiveItem(item.id);
        } else if (item.type === 'schedule_break') {
            element.className = 'schedule-break-item';
        }

        element.appendChild(itemName);
        element.appendChild(editBtn);
        listContainer.appendChild(element);
    });
}


// =================================================================
// --- FILTERING LOGIC ---
// =================================================================
function handleFilterChange(e) {
    renderFilterControls();
}

function renderFilterControls() {
    const filterContainer = document.getElementById('filter-controls');
    filterContainer.innerHTML = '';
    const filterType = document.getElementById('filter-by-select').value;

    if (filterType === 'all') {
        activeFilter = { type: 'all', value: '' };
        renderSchedule();
        return;
    }

    let inputElement;
    if (filterType === 'date') {
        inputElement = document.createElement('input');
        inputElement.type = 'date';
        inputElement.className = 'panel-sort';
    } else if (filterType === 'status') {
        inputElement = document.createElement('select');
        inputElement.className = 'panel-sort';
        inputElement.innerHTML = `
            <option value="">Select Status</option>
            <option value="Pending">Pending</option>
            <option value="NOT SHOT">NOT SHOT</option>
            <option value="Done">Done</option>
        `;
    } else if (filterType === 'cast') {
        inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = 'Enter Cast Name';
        inputElement.className = 'panel-sort';
    }

    if (inputElement) {
        const updateFilter = (e) => {
            currentPage = 1; // Reset to first page on filter value change
            activeFilter = { type: filterType, value: e.target.value.trim().toLowerCase() };
            renderSchedule();
        };
        inputElement.addEventListener('change', updateFilter);
        if (inputElement.type === 'text') {
             inputElement.addEventListener('keyup', updateFilter);
        }
        filterContainer.appendChild(inputElement);
        activeFilter = { type: filterType, value: '' };
        renderSchedule();
    }
}

function getVisibleScenes() {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') return [];
    
    const allScenes = activeSequence.scenes;

    if (activeFilter.type === 'all' || !activeFilter.value) { return allScenes; }

    return allScenes.filter(scene => {
        if (!scene.hasOwnProperty(activeFilter.type)) return false;
        const sceneValue = (scene[activeFilter.type] || '').toString().toLowerCase();
        const filterValue = activeFilter.value.toLowerCase();
        return sceneValue.includes(filterValue);
    });
}

function resetFilter() {
    activeFilter = { type: 'all', value: '' };
    currentPage = 1;
    const filterSelect = document.getElementById('filter-by-select');
    if (filterSelect) filterSelect.value = 'all';
    renderFilterControls();
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

/**
 * MODIFIED: This function now implements pagination.
 */
function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    const display = document.getElementById('active-sequence-display');
    container.innerHTML = '';
    
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence || activeSequence.type !== 'sequence') {
        display.textContent = 'No active sequence. Create or select a sequence.';
        renderPaginationControls(0, 0); // Clear pagination controls
        return;
    }
    
    display.textContent = `Current Sequence: ${activeSequence.name}`;
    const allMatchingScenes = getVisibleScenes();
    
    // Pagination Calculations
    const startIndex = (currentPage - 1) * scenesPerPage;
    const endIndex = startIndex + scenesPerPage;
    const paginatedScenes = allMatchingScenes.slice(startIndex, endIndex);

    if (allMatchingScenes.length === 0) {
        if (activeFilter.type !== 'all') {
            container.innerHTML = `<p style="text-align:center; color: #9ca3af;">No scenes match the current filter.</p>`;
        } else {
             container.innerHTML = `<p style="text-align:center; color: #9ca3af;">No scenes yet. Add one below!</p>`;
        }
    } else {
        paginatedScenes.forEach(scene => {
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
    
    // Render the pagination controls
    renderPaginationControls(allMatchingScenes.length, scenesPerPage);
}

/**
 * NEW: Renders the pagination controls (buttons, page info).
 */
function renderPaginationControls(totalItems, itemsPerPage) {
    const container = document.getElementById('pagination-controls');
    container.innerHTML = '';

    if (totalItems <= itemsPerPage) return; // No need for controls if everything fits on one page

    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const prevButton = document.createElement('button');
    prevButton.textContent = 'Previous';
    prevButton.className = 'btn-primary';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderSchedule();
        }
    });

    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next';
    nextButton.className = 'btn-primary';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderSchedule();
        }
    });

    container.appendChild(prevButton);
    container.appendChild(pageInfo);
    container.appendChild(nextButton);
}


function deleteScene(id) {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence) return;
    activeSequence.scenes = activeSequence.scenes.filter(scene => scene.id !== id);
    saveProjectData();
    renderSchedule();
}

// =================================================================
// --- DATA PERSISTENCE & PROJECT FILES (No Changes Below This Line) ---
// =================================================================
function saveProjectData(isBackup = false) {
    const key = isBackup ? 'projectData_backup' : 'projectData';
    localStorage.setItem(key, JSON.stringify(projectData));
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
    const contactInput = document.getElementById('scene-contact');
    if (contactInput) contactInput.value = lastContactPerson;
    renderSchedule();
    renderSequencePanel();
}
function clearProject() {
    if (confirm('Are you sure you want to clear the entire project? This action cannot be undone.')) {
        projectData = { panelItems: [], activeItemId: null, projectInfo: {} };
        lastContactPerson = '';
        saveProjectData();
        renderSchedule();
        renderSequencePanel();
    }
}
function saveProjectFile() {
     try {
        const projectInfo = projectData.projectInfo || {};
        const projectName = projectInfo.prodName || 'UntitledProject';
        const dataStr = JSON.stringify(projectData, null, 2);
        const dataBlob = new Blob([dataStr], {type: "application/json"});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName.replace(/[^a-zA-Z0-9]/g, '_')}.filmproj`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error saving project file:", error);
        alert("Could not save project file. See console for details.");
    }
}
function openProjectFile(event) {
    const file = event.target.files[0];
    if (!file) { return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data && typeof data === 'object' && Array.isArray(data.panelItems) && data.hasOwnProperty('projectInfo')) {
                if (confirm("This will replace your current project. Are you sure you want to proceed?")) {
                    projectData = data;
                    if (!projectData.projectInfo) projectData.projectInfo = {};
                    if (!projectData.panelItems) projectData.panelItems = [];
                    if (projectData.activeItemId === null && projectData.panelItems.length > 0) {
                        const firstSequence = projectData.panelItems.find(i => i.type === 'sequence');
                        if (firstSequence) projectData.activeItemId = firstSequence.id;
                    }
                    saveProjectData();
                    loadProjectData();
                    alert("Project loaded successfully.");
                }
            } else {
                alert("Invalid project file format.");
            }
        } catch (error) {
            console.error("Error opening project file:", error);
            alert("Could not open project file. It may be corrupted or in the wrong format.");
        } finally {
            event.target.value = '';
        }
    };
    reader.onerror = () => {
        alert("Error reading file.");
        event.target.value = '';
    };
    reader.readAsText(file);
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
    if(confirm("Are you sure you want to delete this scene?")) {
        const sceneId = parseInt(document.getElementById('edit-scene-id').value);
        deleteScene(sceneId);
        closeEditModal();
    }
}

// =================================================================
// --- EXPORT & SHARE FUNCTIONS ---
// =================================================================
function saveAsExcel(isFullProject = false) {
    const projectInfo = projectData.projectInfo || {};
    const workbook = XLSX.utils.book_new();

    const createSheet = (scenes, sheetName) => {
        let scheduleBreakName = 'Uncategorized';
        const sequenceIndex = projectData.panelItems.findIndex(item => item.name === sheetName && item.type === 'sequence');
        if (sequenceIndex > -1) {
            for (let i = sequenceIndex - 1; i >= 0; i--) {
                if (projectData.panelItems[i].type === 'schedule_break') {
                    scheduleBreakName = projectData.panelItems[i].name;
                    break;
                }
            }
        }

        const projectHeader = [
            ["Production:", projectInfo.prodName || 'N/A', null, "Director:", projectInfo.directorName || 'N/A'],
            ["Contact:", projectInfo.contactNumber || 'N/A', null, "Email:", projectInfo.contactEmail || 'N/A'],
            [],
            [`Schedule Break: ${scheduleBreakName}`],
            [`Sequence: ${sheetName}`],
            []
        ];
        const tableHeader = ['Scene #', 'Scene Heading', 'Date', 'Time', 'Type', 'Location', 'Pages', 'Duration', 'Status', 'Cast', 'Key Equipment', 'Contact'];
        
        const tableBody = scenes.map(s => [
            s.number, s.heading, formatDateDDMMYYYY(s.date), s.time, s.type, s.location, s.pages, s.duration, s.status, s.cast, s.equipment, s.contact
        ]);

        const fullSheetData = projectHeader.concat([tableHeader]).concat(tableBody);
        const worksheet = XLSX.utils.aoa_to_sheet(fullSheetData);

        const numCols = tableHeader.length - 1;
        worksheet['!merges'] = [
            { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } }, { s: { r: 0, c: 4 }, e: { r: 0, c: numCols } },
            { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, { s: { r: 1, c: 4 }, e: { r: 1, c: numCols } },
            { s: { r: 3, c: 0 }, e: { r: 3, c: numCols } }, { s: { r: 4, c: 0 }, e: { r: 4, c: numCols } }
        ];
        
        if (scenes.length > 0) {
             const colWidths = tableHeader.map((_, i) => {
                const allValues = [tableHeader[i] || ''].concat(tableBody.map(row => (row[i] || '').toString()));
                const maxLength = Math.max(...allValues.map(val => val.length));
                return { wch: Math.min(50, Math.max(12, maxLength + 2)) };
            });
            worksheet['!cols'] = colWidths;
        }

        return worksheet;
    };

    if (isFullProject) {
        console.log("Starting full project export...");
        projectData.panelItems.forEach(item => {
            if (item.type === 'sequence' && item.scenes && item.scenes.length > 0) {
                console.log(`Found sequence with scenes: "${item.name}". Creating sheet...`);
                const worksheet = createSheet(item.scenes, item.name);
                const safeSheetName = item.name.replace(/[/\\?*:[\]]/g, '').substring(0, 31);
                XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);
            }
        });
        
        if(workbook.SheetNames.length === 0){ 
            alert("Export failed: No sequences with scenes were found in your project."); 
            return;
        }
        
        console.log(`Exporting workbook with ${workbook.SheetNames.length} sheets: ${workbook.SheetNames.join(', ')}`);
        XLSX.writeFile(workbook, `${(projectInfo.prodName || 'FullProject').replace(/[^a-zA-Z0-9]/g, '_')}_Schedule.xlsx`);
        alert(`Successfully exported ${workbook.SheetNames.length} sequence(s) into a single Excel file.\n\nPlease check the tabs at the bottom of the Excel window to see all the sheets.`);
    } else {
        const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
        if (!activeSequence) { alert("Please select a sequence to export."); return; }
        const scenesToExport = getVisibleScenes();
        if (scenesToExport.length === 0) { alert(`No visible scenes in "${activeSequence.name}" to export.`); return; }
        
        const worksheet = createSheet(scenesToExport, activeSequence.name);
        XLSX.utils.book_append_sheet(workbook, worksheet, activeSequence.name.replace(/[/\\?*:[\]]/g, '').substring(0, 31));
        XLSX.writeFile(workbook, `${activeSequence.name.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule.xlsx`);
    }
}

async function shareProject() {
    const projectInfo = projectData.projectInfo || {};
    const totalSequences = projectData.panelItems.filter(i => i.type === 'sequence').length;
    const totalScenes = projectData.panelItems
        .filter(i => i.type === 'sequence')
        .reduce((sum, seq) => sum + (seq.scenes ? seq.scenes.length : 0), 0);

    const shareText = `*ToshooT Project Summary*\nProduction: ${projectInfo.prodName || 'N/A'}\nDirector: ${projectInfo.directorName || 'N/A'}\nContact: ${projectInfo.contactNumber || 'N/A'}\n\nTotal Sequences: ${totalSequences}\nTotal Scenes: ${totalScenes}`;

    if (navigator.share) {
        try {
            await navigator.share({ title: `Project: ${projectInfo.prodName || 'Untitled'}`, text: shareText });
        } catch (err) { console.error("Share failed:", err); }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            alert("Project info copied to clipboard!");
        } catch (err) { alert("Sharing is not supported on this browser, and copying to clipboard failed."); }
    }
}

async function shareScene(id) {
    const activeSequence = projectData.panelItems.find(item => item.id === projectData.activeItemId);
    if (!activeSequence) return;
    const scene = activeSequence.scenes.find(s => s.id === id);
    if (!scene) return;
    const projectInfo = projectData.projectInfo || {};

    const template = document.getElementById('share-card-template');
    template.innerHTML = `
        <div class="share-card-content">
            <div class="share-card-header">
                <h1>Scene ${scene.number || 'N/A'}</h1>
                <h2>${scene.heading || 'N/A'}</h2>
            </div>
             <div class="share-card-item"><strong>Pages:</strong> ${scene.pages || 'N/A'}</div>
            <div class="share-card-item"><strong>Location:</strong> ${scene.type}. ${scene.location}</div>
            <div class="share-card-item"><strong>Cast:</strong> ${scene.cast || 'N/A'}</div>
             <div class="share-card-item"><strong>Date:</strong> ${formatDateDDMMYYYY(scene.date)}</div>
            <div class="share-card-item"><strong>Time:</strong> ${formatTime12Hour(scene.time)}</div>
            <div class="share-card-item"><strong>Contact:</strong> ${scene.contact || 'N/A'}</div>
            <div class="share-card-footer">
                <div class="footer-project-info">
                    <div><strong>${projectInfo.prodName || 'Production'}</strong></div>
                    <div>${projectInfo.directorName ? 'Dir: ' + projectInfo.directorName : ''}</div>
                </div>
                <div class="footer-brand">ToassisT App</div>
            </div>
        </div>
    `;
    
   try {
        const canvas = await html2canvas(template, { useCORS: true, backgroundColor: '#1f2937' });
        canvas.toBlob(async (blob) => {
            const fileName = `Scene_${scene.number}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Shooting Info: Scene ${scene.number}`,
                    text: `Details for Scene ${scene.number} - ${scene.heading}`,
                    files: [file]
                });
            } else {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(link.href);
            }
        }, 'image/png');
    } catch (err) {
        console.error("Failed to share scene:", err);
        alert("Could not generate shareable image.");
    }
}

// =================================================================
// --- UTILITY FUNCTIONS ---
// =================================================================
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
    } else {
        autoSaveInterval = setInterval(() => {
            saveProjectData(false); 
            saveProjectData(true); 
        }, 120000); 
        statusEl.textContent = 'ON';
        statusEl.className = 'auto-save-status on';
        alert('Auto-save is now ON. Your project will be saved to this browser\'s storage every 2 minutes.');
    }
}
