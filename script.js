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
    renderSchedule();
}

// =================================================================
// --- CORE SCHEDULE FUNCTIONS ---
// =================================================================
function handleAddScene(e) {
    e.preventDefault();
    if (projectData.activeSequenceIndex === -1) {
        if (confirm("No sequence created. Would you like to create 'Sequence 1' to add this scene?")) {
            handleNewSequence();
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
    if (projectData.activeSequenceIndex > -1 && projectData.sequences.length > 0) {
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
function openEditModal(id) {
    if (projectData.activeSequenceIndex < 0) return;
    const scene = projectData.sequences[projectData.activeSequenceIndex].scenes.find(s => s.id === id);
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
    const sceneIndex = projectData.sequences[projectData.activeSequenceIndex].scenes.findIndex(s => s.id === sceneId);
    if (sceneIndex === -1) return;
    projectData.sequences[projectData.activeSequenceIndex].scenes[sceneIndex] = {
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
// --- EXPORT & SHARE FUNCTIONS ---
// =================================================================
function saveAsExcel() {
    if (projectData.activeSequenceIndex < 0) { alert("Please select a sequence to export."); return; }
    const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
    const sequenceName = projectData.sequences[projectData.activeSequenceIndex].name;
    if (activeScenes.length === 0) { alert(`Sequence "${sequenceName}" has no scenes to export.`); return; }
    const worksheet = XLSX.utils.json_to_sheet(activeScenes);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sequenceName);
    XLSX.writeFile(workbook, `${sequenceName}_Schedule.xlsx`);
}

async function shareProject() {
    const projectInfo = projectData.projectInfo || {};
    const baseName = projectInfo.prodName || 'Schedule';

    const jsonBlob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], `${baseName}.filmproj`, { type: 'application/json' });
    
    if (navigator.canShare && navigator.canShare({ files: [jsonFile] })) {
        try {
            await navigator.share({
                title: `${baseName} Project`,
                text: `Here is the project file for ${baseName}.`,
                files: [jsonFile]
            });
        } catch (error) { console.error("Sharing failed:", error); }
    } else { alert("Web Share is not supported on this browser. This feature is best on mobile."); }
}

async function shareScene(id) {
    if (projectData.activeSequenceIndex < 0) return;
    const template = document.getElementById('share-card-template');
    const scene = projectData.sequences[projectData.activeSequenceIndex].scenes.find(s => s.id === id); 
    const projectInfo = projectData.projectInfo || {};
    if (!template || !scene) return;
    
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
