// =================================================================
// --- GLOBAL STATE & DATA STRUCTURE ---
// =================================================================
let projectData = {
    sequences: [],
    activeSequenceIndex: -1,
    projectInfo: {}
};
let lastContactPerson = '';

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadProjectData();
    const contactInput = document.getElementById('scene-contact');
    if (contactInput) contactInput.value = lastContactPerson;
});

// =================================================================
// --- SETUP ALL EVENT LISTENERS ---
// =================================================================
function setupEventListeners() {
    // Main Form
    document.getElementById('schedule-form').addEventListener('submit', handleAddScene);

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
    document.getElementById('sort-by-select').addEventListener('change', (e) => sortActiveSequence(e.target.value));

    // Modals Close Buttons
    document.getElementById('close-project-modal').addEventListener('click', closeProjectModal);
    document.getElementById('save-project-info-btn').addEventListener('click', handleSaveProjectInfo);
    document.getElementById('close-edit-modal').addEventListener('click', closeEditModal);
    document.getElementById('save-changes-btn').addEventListener('click', handleSaveChanges);
    document.getElementById('delete-scene-btn').addEventListener('click', handleDeleteFromModal);
    document.getElementById('close-info-modal').addEventListener('click', () => document.getElementById('info-modal').style.display = 'none');
    document.getElementById('close-about-modal').addEventListener('click', () => document.getElementById('about-modal').style.display = 'none');

    // Global click listener to close dropdowns/panels
    document.addEventListener('click', (event) => {
        if (dropdownMenu.classList.contains('show') && !hamburgerBtn.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}


// =================================================================
// --- SEQUENCE MANAGEMENT ---
// =================================================================
function handleNewSequence() {
    let sequenceName = prompt("Enter a name for the new sequence:");
    if (sequenceName === null) return;
    if (sequenceName.trim() === "") { sequenceName = `Sequence ${projectData.sequences.length + 1}`; }
    projectData.sequences.push({ name: sequenceName, scenes: [] });
    setActiveSequence(projectData.sequences.length - 1);
}

function setActiveSequence(index) {
    projectData.activeSequenceIndex = index;
    saveProjectData();
    renderSchedule();
    renderSequencePanel();
    document.getElementById('sequence-panel').classList.remove('open');
}

function renderSequencePanel() {
    const listContainer = document.getElementById('sequence-list');
    listContainer.innerHTML = '';
    projectData.sequences.forEach((seq, index) => {
        const button = document.createElement('button');
        button.className = `sequence-item ${index === projectData.activeSequenceIndex ? 'active' : ''}`;
        button.textContent = seq.name;
        button.onclick = () => setActiveSequence(index);
        listContainer.appendChild(button);
    });
}

function sortActiveSequence(sortBy) {
    if (projectData.activeSequenceIndex < 0 || sortBy === 'default') return;
    const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
    activeScenes.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1;
        if (a[sortBy] > b[sortBy]) return 1;
        return 0;
    });
    renderSchedule(); // Re-render the UI with the sorted list
}

// =================================================================
// --- CORE SCHEDULE FUNCTIONS ---
// =================================================================
function handleAddScene(e) {
    e.preventDefault();
    if (projectData.activeSequenceIndex === -1) {
        if (confirm("No sequence selected. Would you like to create 'Sequence 1' to add this scene?")) {
            handleNewSequence();
            // If user cancels the prompt for a name, exit
            if (projectData.activeSequenceIndex === -1) return;
        } else {
            return;
        }
    }

    const newScene = {
        id: Date.now(),
        number: document.getElementById('scene-number').value,
        heading: document.getElementById('scene-heading').value,
        date: document.getElementById('scene-date').value,
        time: document.getElementById('scene-time').value,
        type: document.getElementById('scene-type').value,
        location: document.getElementById('scene-location').value,
        pages: document.getElementById('scene-pages').value,
        duration: document.getElementById('scene-duration').value,
        status: document.getElementById('scene-status').value,
        cast: document.getElementById('scene-cast').value,
        equipment: document.getElementById('scene-equipment').value,
        contact: document.getElementById('scene-contact').value,
    };
    projectData.sequences[projectData.activeSequenceIndex].scenes.push(newScene);
    lastContactPerson = newScene.contact;
    saveProjectData();
    renderSchedule();
    e.target.reset();
    document.getElementById('scene-contact').value = lastContactPerson;
}

function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    const sequenceDisplay = document.getElementById('active-sequence-display');
    container.innerHTML = '';
    
    if (projectData.activeSequenceIndex < 0 || !projectData.sequences[projectData.activeSequenceIndex]) {
        sequenceDisplay.textContent = 'No active sequence. Create one from the menu.';
        return;
    }

    sequenceDisplay.textContent = `Current Sequence: ${projectData.sequences[projectData.activeSequenceIndex].name}`;

    const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
    activeScenes.forEach(scene => {
        const stripWrapper = document.createElement('div');
        stripWrapper.className = 'scene-strip-wrapper';
        const statusClass = scene.status.replace(/\s+/g, '-').toLowerCase();
        stripWrapper.innerHTML = `
            <div class="scene-strip" id="scene-strip-${scene.id}">
                <div class="strip-item"><strong>#${scene.number}</strong></div>
                <div class="strip-item">${scene.heading}</div>
                <div class="strip-item">${scene.date}</div>
                <div class="strip-item">${scene.time}</div>
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
    if (projectData.activeSequenceIndex < 0) return;
    const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
    projectData.sequences[projectData.activeSequenceIndex].scenes = activeScenes.filter(scene => scene.id !== id);
    saveProjectData();
    renderSchedule();
}

// =================================================================
// --- DATA PERSISTENCE & PROJECT FILES ---
// =================================================================
function saveProjectData() { localStorage.setItem('projectData', JSON.stringify(projectData)); }
function loadProjectData() {
    const savedData = localStorage.getItem('projectData');
    projectData = savedData ? JSON.parse(savedData) : { sequences: [], activeSequenceIndex: -1, projectInfo: {} };
    if (!projectData.projectInfo) projectData.projectInfo = {};
    if (projectData.activeSequenceIndex === -1 && projectData.sequences.length > 0) {
        projectData.activeSequenceIndex = 0;
    }
    if (projectData.activeSequenceIndex > -1) {
        const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
        if (activeScenes.length > 0) { lastContactPerson = activeScenes[activeScenes.length - 1].contact || ''; }
    }
    renderSchedule();
    renderSequencePanel();
}
function clearProject() {
    if (confirm('Are you sure you want to clear the entire project? This will delete all sequences and scenes.')) {
        projectData = { sequences: [], activeSequenceIndex: -1, projectInfo: {} };
        lastContactPerson = '';
        saveProjectData();
        renderSchedule();
        renderSequencePanel();
        alert('Project cleared.');
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
            if (loadedData && loadedData.sequences && loadedData.hasOwnProperty('activeSequenceIndex')) {
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
function openEditModal(id) { /* ... */ }
function closeEditModal() { /* ... */ }
function handleSaveChanges() { /* ... */ }
function handleDeleteFromModal() { /* ... */ }

// =================================================================
// --- EXPORT & SHARE FUNCTIONS ---
// =================================================================
function saveAsExcel() { /* ... */ }
async function shareProject() { /* ... */ }
async function shareScene(id) { /* ... */ }
function formatTime12Hour(timeString) { /* ... */ }
