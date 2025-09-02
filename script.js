// =================================================================
// --- GLOBAL STATE & INITIALIZATION ---
// =================================================================
let scheduleData = [];
let lastContactPerson = '';

document.addEventListener('DOMContentLoaded', () => {
    // --- ELEMENT SELECTORS ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const scheduleForm = document.getElementById('schedule-form');
    
    // --- MENU BUTTON SELECTORS ---
    const newProjectBtn = document.getElementById('new-project-btn');
    const openProjectBtn = document.getElementById('open-project-btn');
    const saveProjectBtn = document.getElementById('save-project-btn');
    const saveExcelBtn = document.getElementById('save-excel-btn');
    const shareProjectBtn = document.getElementById('share-project-btn');
    const clearProjectBtn = document.getElementById('clear-project-btn');

    // --- MODAL SELECTORS ---
    const projectModal = document.getElementById('project-info-modal');
    const editModal = document.getElementById('edit-scene-modal');
    const fileInput = document.getElementById('file-input');
    
    // --- INITIAL PAGE LOAD ---
    if (scheduleForm) {
        loadScheduleData();
        document.getElementById('scene-contact').value = lastContactPerson;
    }

    // --- EVENT LISTENERS ---
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }

    document.addEventListener('click', () => {
        if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });

    if (scheduleForm) scheduleForm.addEventListener('submit', handleAddScene);
    
    // Menu Button Listeners
    if (newProjectBtn) newProjectBtn.addEventListener('click', openProjectModal);
    if (openProjectBtn) openProjectBtn.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', openProjectFile);
    if (saveProjectBtn) saveProjectBtn.addEventListener('click', saveProjectFile);
    if (saveExcelBtn) saveExcelBtn.addEventListener('click', saveAsExcel);
    if (shareProjectBtn) shareProjectBtn.addEventListener('click', shareProject);
    if (clearProjectBtn) clearProjectBtn.addEventListener('click', clearProject);
    
    // Project Modal Listeners
    if (projectModal) {
        projectModal.querySelector('#close-project-modal').addEventListener('click', closeProjectModal);
        document.getElementById('save-project-info-btn').addEventListener('click', handleSaveProjectInfo);
    }

    // Edit Modal Listeners
    if (editModal) {
        editModal.querySelector('#close-edit-modal').addEventListener('click', closeEditModal);
        document.getElementById('save-changes-btn').addEventListener('click', handleSaveChanges);
        document.getElementById('delete-scene-btn').addEventListener('click', handleDeleteFromModal);
    }
});


// =================================================================
// --- CORE SCHEDULE FUNCTIONS (Add, Render, Delete) ---
// =================================================================
function handleAddScene(e) { /* ... (same as before) ... */ }
function renderSchedule() { /* ... (same as before) ... */ }
function deleteScene(id) { /* ... (same as before) ... */ }
// Note: These functions are unchanged from the last version, but included here for completeness.
function handleAddScene(e) {
    e.preventDefault();
    const newScene = { id: Date.now(), number: document.getElementById('scene-number').value, heading: document.getElementById('scene-heading').value, date: document.getElementById('scene-date').value, time: document.getElementById('scene-time').value, type: document.getElementById('scene-type').value, location: document.getElementById('scene-location').value, pages: document.getElementById('scene-pages').value, duration: document.getElementById('scene-duration').value, status: document.getElementById('scene-status').value, cast: document.getElementById('scene-cast').value, equipment: document.getElementById('scene-equipment').value, contact: document.getElementById('scene-contact').value, };
    lastContactPerson = newScene.contact;
    scheduleData.push(newScene);
    saveScheduleData();
    renderSchedule();
    e.target.reset();
    document.getElementById('scene-contact').value = lastContactPerson;
}
function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    if (!container) return;
    container.innerHTML = ''; 
    scheduleData.forEach(scene => {
        const stripWrapper = document.createElement('div');
        stripWrapper.className = 'scene-strip-wrapper';
        const statusClass = scene.status.toLowerCase();
        stripWrapper.innerHTML = `<div class="scene-strip" id="scene-strip-${scene.id}"><div class="strip-item"><strong>#${scene.number}</strong></div><div class="strip-item">${scene.heading}</div><div class="strip-item"><span class="strip-status ${statusClass}">${scene.status}</span></div></div><div class="scene-actions"><button class="edit-btn-strip" title="Edit Scene"><i class="fas fa-pencil-alt"></i></button><button class="share-btn-strip" title="Share as Image"><i class="fas fa-share-alt"></i></button></div>`;
        stripWrapper.querySelector('.edit-btn-strip').addEventListener('click', () => openEditModal(scene.id));
        stripWrapper.querySelector('.share-btn-strip').addEventListener('click', () => shareScene(scene.id));
        container.appendChild(stripWrapper);
    });
}
function deleteScene(id) {
    if (confirm('Are you sure you want to permanently delete this scene?')) {
        scheduleData = scheduleData.filter(scene => scene.id !== id);
        saveScheduleData();
        renderSchedule();
        closeEditModal();
    }
}

// =================================================================
// --- DATA PERSISTENCE & PROJECT INFO ---
// =================================================================
function saveScheduleData() { localStorage.setItem('scheduleData', JSON.stringify(scheduleData)); }
function loadScheduleData() {
    const savedData = localStorage.getItem('scheduleData');
    scheduleData = savedData ? JSON.parse(savedData) : [];
    if (scheduleData.length > 0) { lastContactPerson = scheduleData[scheduleData.length - 1].contact || ''; }
    renderSchedule();
}
function openProjectModal() { /* ... (same as before) ... */ }
function closeProjectModal() { /* ... (same as before) ... */ }
function handleSaveProjectInfo() { /* ... (same as before) ... */ }
// Note: These functions are unchanged, but included for completeness.
function openProjectModal() {
    const projectInfo = JSON.parse(localStorage.getItem('projectInfo')) || {};
    document.getElementById('prod-name').value = projectInfo.prodName || '';
    document.getElementById('director-name').value = projectInfo.directorName || '';
    document.getElementById('contact-number').value = projectInfo.contactNumber || '';
    document.getElementById('contact-email').value = projectInfo.contactEmail || '';
    document.getElementById('project-info-modal').style.display = 'block';
}
function closeProjectModal() { document.getElementById('project-info-modal').style.display = 'none'; }
function handleSaveProjectInfo() {
    const projectInfo = { prodName: document.getElementById('prod-name').value, directorName: document.getElementById('director-name').value, contactNumber: document.getElementById('contact-number').value, contactEmail: document.getElementById('contact-email').value };
    localStorage.setItem('projectInfo', JSON.stringify(projectInfo));
    closeProjectModal();
}

// =================================================================
// --- EDIT MODAL LOGIC ---
// =================================================================
function openEditModal(id) { /* ... (same as before) ... */ }
function closeEditModal() { /* ... (same as before) ... */ }
function handleSaveChanges() { /* ... (same as before) ... */ }
function handleDeleteFromModal() {
    const sceneId = parseInt(document.getElementById('edit-scene-id').value);
    deleteScene(sceneId);
}
// Note: These functions are unchanged, but included for completeness.
function openEditModal(id) {
    const scene = scheduleData.find(s => s.id === id); if (!scene) return;
    document.getElementById('edit-scene-id').value = scene.id; document.getElementById('edit-scene-number').value = scene.number;
    document.getElementById('edit-scene-heading').value = scene.heading; document.getElementById('edit-scene-date').value = scene.date;
    document.getElementById('edit-scene-time').value = scene.time; document.getElementById('edit-scene-type').value = scene.type;
    document.getElementById('edit-scene-location').value = scene.location; document.getElementById('edit-scene-pages').value = scene.pages;
    document.getElementById('edit-scene-duration').value = scene.duration; document.getElementById('edit-scene-status').value = scene.status;
    document.getElementById('edit-scene-cast').value = scene.cast; document.getElementById('edit-scene-equipment').value = scene.equipment;
    document.getElementById('edit-scene-contact').value = scene.contact;
    document.getElementById('edit-scene-modal').style.display = 'block';
}
function closeEditModal() { document.getElementById('edit-scene-modal').style.display = 'none'; }
function handleSaveChanges() {
    const sceneId = parseInt(document.getElementById('edit-scene-id').value);
    const sceneIndex = scheduleData.findIndex(s => s.id === sceneId); if (sceneIndex === -1) return;
    scheduleData[sceneIndex] = { id: sceneId, number: document.getElementById('edit-scene-number').value, heading: document.getElementById('edit-scene-heading').value, date: document.getElementById('edit-scene-date').value, time: document.getElementById('edit-scene-time').value, type: document.getElementById('edit-scene-type').value, location: document.getElementById('edit-scene-location').value, pages: document.getElementById('edit-scene-pages').value, duration: document.getElementById('edit-scene-duration').value, status: document.getElementById('edit-scene-status').value, cast: document.getElementById('edit-scene-cast').value, equipment: document.getElementById('edit-scene-equipment').value, contact: document.getElementById('edit-scene-contact').value };
    saveScheduleData(); renderSchedule(); closeEditModal();
}

// =================================================================
// --- NEW & UPDATED MENU FUNCTIONS ---
// =================================================================
/**
 * Clears all project data from localStorage after confirmation.
 */
function clearProject() {
    if (confirm('Are you sure you want to clear the entire project? This will delete all scenes and project info.')) {
        localStorage.removeItem('scheduleData');
        localStorage.removeItem('projectInfo');
        scheduleData = [];
        lastContactPerson = '';
        renderSchedule(); // Re-render the now-empty list
        alert('Project cleared.');
    }
}

/**
 * Saves the current schedule and project info as a downloadable .filmproj file.
 */
function saveProjectFile() {
    const projectInfo = JSON.parse(localStorage.getItem('projectInfo')) || {};
    const projectData = {
        projectInfo: projectInfo,
        scheduleData: scheduleData
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectInfo.prodName || 'Schedule'}.filmproj`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Handles the file input to open and load a .filmproj file.
 */
function openProjectFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const projectData = JSON.parse(e.target.result);
            localStorage.setItem('scheduleData', JSON.stringify(projectData.scheduleData || []));
            localStorage.setItem('projectInfo', JSON.stringify(projectData.projectInfo || {}));
            alert('Project loaded successfully!');
            loadScheduleData(); // Reload all data and re-render the UI
        } catch (error) {
            alert('Error: Could not read the project file.');
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

/**
 * Shares the project as a .filmproj or .xlsx file using the Web Share API.
 */
async function shareProject() {
    if (scheduleData.length === 0) {
        alert("There is no data to share.");
        return;
    }
    const projectInfo = JSON.parse(localStorage.getItem('projectInfo')) || {};
    const baseName = projectInfo.prodName || 'Schedule';

    // 1. Create the JSON file in memory
    const projectData = { projectInfo: projectInfo, scheduleData: scheduleData };
    const jsonBlob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const jsonFile = new File([jsonBlob], `${baseName}.filmproj`, { type: 'application/json' });

    // 2. Create the Excel file in memory
    const worksheet = XLSX.utils.json_to_sheet(scheduleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const excelFile = new File([excelBlob], `${baseName}.xlsx`, { type: excelBlob.type });

    // 3. Use Web Share API
    if (navigator.canShare && navigator.canShare({ files: [jsonFile, excelFile] })) {
        try {
            await navigator.share({
                title: `${baseName} Project`,
                text: `Here is the project schedule for ${baseName}.`,
                files: [jsonFile, excelFile]
            });
        } catch (error) {
            console.error("Sharing failed:", error);
        }
    } else {
        alert("Web Share is not supported on this browser. This feature is best on mobile.");
    }
}

// --- EXISTING EXPORT & SHARE FUNCTIONS ---
function saveAsExcel() { /* ... (same as before) ... */ }
async function shareScene(id) { /* ... (same as before) ... */ }
function formatTime12Hour(timeString) { /* ... (same as before) ... */ }
// Note: These functions are unchanged, but included for completeness.
function saveAsExcel() { if (scheduleData.length === 0) { alert("No schedule data to export."); return; } const worksheet = XLSX.utils.json_to_sheet(scheduleData); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Shooting Schedule"); XLSX.writeFile(workbook, "ShootingSchedule.xlsx"); }
async function shareScene(id) { const template = document.getElementById('share-card-template'); const scene = scheduleData.find(s => s.id === id); const projectInfo = JSON.parse(localStorage.getItem('projectInfo')) || {}; if (!template || !scene) return; let footerHtml = `<div class="footer-project-info">${projectInfo.prodName ? `<div>${projectInfo.prodName}</div>` : ''}${projectInfo.directorName ? `<div>Dir: ${projectInfo.directorName}</div>` : ''}</div><div class="footer-brand">@Thosho Tech</div>`; template.innerHTML = `<div class="share-card-content"><div class="share-card-header"><h1>Scene #${scene.number}</h1><h2>${scene.heading}</h2></div><p class="share-card-item"><strong>Date:</strong> ${scene.date}</p><p class="share-card-item"><strong>Time:</strong> ${formatTime12Hour(scene.time)}</p><p class="share-card-item"><strong>Location:</strong> ${scene.type}. ${scene.location}</p><p class="share-card-item"><strong>Cast:</strong> ${scene.cast || 'N/A'}</p><p class="share-card-item"><strong>Contact:</strong> 📞 ${scene.contact || 'N/A'}</p><div class="share-card-footer">${footerHtml}</div></div>`; try { const canvas = await html2canvas(template, { scale: 2 }); const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png')); const file = new File([blob], `scene_${scene.number}.png`, { type: 'image/png' }); if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: `Shooting Schedule - Scene ${scene.number}` }); } else { const imgUrl = URL.createObjectURL(blob); window.open(imgUrl, '_blank'); } } catch (error) { console.error('Sharing failed:', error); } }
function formatTime12Hour(timeString) { if (!timeString) return "N/A"; const [hour, minute] = timeString.split(':'); const hourInt = parseInt(hour, 10); const ampm = hourInt >= 12 ? 'PM' : 'AM'; const hour12 = hourInt % 12 || 12; return `${hour12}:${minute} ${ampm}`; }
