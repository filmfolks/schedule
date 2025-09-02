// =================================================================
// --- GLOBAL STATE & DATA STRUCTURE ---
// =================================================================
let projectData = {
    sequences: [],
    activeSequenceIndex: -1
};
let lastContactPerson = '';

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT & EVENT LISTENER SETUP ---
    // (This section finds all buttons and sets up their click events)
    setupEventListeners();
    
    // --- INITIAL PAGE LOAD ---
    loadProjectData();
    document.getElementById('scene-contact').value = lastContactPerson;
});

// =================================================================
// --- NEW: SEQUENCE MANAGEMENT ---
// =================================================================

function handleNewSequence() {
    let sequenceName = prompt("Enter a name for the new sequence:");
    if (sequenceName === null) return; // User cancelled

    if (sequenceName.trim() === "") {
        sequenceName = `Sequence ${projectData.sequences.length + 1}`;
    }

    const newSequence = {
        name: sequenceName,
        scenes: []
    };
    
    projectData.sequences.push(newSequence);
    projectData.activeSequenceIndex = projectData.sequences.length - 1;
    
    saveProjectData();
    renderSchedule();
    renderSequencePanel();
}

function setActiveSequence(index) {
    projectData.activeSequenceIndex = index;
    saveProjectData();
    renderSchedule();
    renderSequencePanel(); // Re-render to show which is active
    document.getElementById('sequence-panel').classList.remove('open'); // Close panel after selection
}

function renderSequencePanel() {
    const listContainer = document.getElementById('sequence-list');
    if (!listContainer) return;
    listContainer.innerHTML = '';

    projectData.sequences.forEach((seq, index) => {
        const button = document.createElement('button');
        button.className = 'sequence-item';
        if (index === projectData.activeSequenceIndex) {
            button.classList.add('active');
        }
        button.textContent = seq.name;
        button.onclick = () => setActiveSequence(index);
        listContainer.appendChild(button);
    });
}

// =================================================================
// --- CORE SCHEDULE FUNCTIONS (ADAPTED FOR SEQUENCES) ---
// =================================================================

function handleAddScene(e) {
    e.preventDefault();
    if (projectData.activeSequenceIndex === -1) {
        alert("Please create a 'New Sequence' from the menu before adding scenes.");
        return;
    }

    const newScene = { /* ... (get data from form) ... */ };
    
    // Add the new scene to the CURRENTLY ACTIVE sequence
    projectData.sequences[projectData.activeSequenceIndex].scenes.push(newScene);
    
    lastContactPerson = newScene.contact;
    saveProjectData();
    renderSchedule();
    e.target.reset();
    document.getElementById('scene-contact').value = lastContactPerson;
}

function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Only render scenes from the active sequence
    if (projectData.activeSequenceIndex > -1) {
        const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
        activeScenes.forEach(scene => {
            // This now creates the DETAILED strip
            const stripWrapper = document.createElement('div');
            // ... (The detailed innerHTML for the strip as in previous versions) ...
            container.appendChild(stripWrapper);
        });
    }
}

function deleteScene(id) {
    if (projectData.activeSequenceIndex === -1) return;
    const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
    // Filter the scenes array of the active sequence
    projectData.sequences[projectData.activeSequenceIndex].scenes = activeScenes.filter(scene => scene.id !== id);
    saveProjectData();
    renderSchedule();
}

// =================================================================
// --- NEW: Sorting Function ---
// =================================================================

function sortActiveSequence(sortBy) {
    if (projectData.activeSequenceIndex === -1) return;
    const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;

    activeScenes.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) return -1;
        if (a[sortBy] > b[sortBy]) return 1;
        return 0;
    });

    renderSchedule(); // Re-render the UI with the sorted list
}

// =================================================================
// --- DATA PERSISTENCE (localStorage for new structure) ---
// =================================================================

function saveProjectData() {
    localStorage.setItem('projectData', JSON.stringify(projectData));
}

function loadProjectData() {
    const savedData = localStorage.getItem('projectData');
    projectData = savedData ? JSON.parse(savedData) : { sequences: [], activeSequenceIndex: -1 };
    
    // If there's no active sequence but there are sequences, default to the first one
    if (projectData.activeSequenceIndex === -1 && projectData.sequences.length > 0) {
        projectData.activeSequenceIndex = 0;
    }

    if (projectData.activeSequenceIndex > -1) {
        const activeScenes = projectData.sequences[projectData.activeSequenceIndex].scenes;
        if (activeScenes.length > 0) {
            lastContactPerson = activeScenes[activeScenes.length - 1].contact || '';
        }
    }
    
    renderSchedule();
    renderSequencePanel();
}


// --- All other functions (Modals, Share, Export, etc.) would be here,
// --- adapted to use the new projectData structure.
// --- For example, saveAsExcel would now export projectData.sequences[projectData.activeSequenceIndex].scenes

// This script now requires a setupEventListeners() function to wire up all the new buttons.
