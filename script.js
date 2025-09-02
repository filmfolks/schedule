// =================================================================
// --- GLOBAL STATE & INITIALIZATION ---
// =================================================================

let scheduleData = [];
let lastContactPerson = '';

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ELEMENT SELECTORS ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const newProjectBtn = document.getElementById('new-project-btn');
    const saveExcelBtn = document.getElementById('save-excel-btn');
    const scheduleForm = document.getElementById('schedule-form');
    
    // --- MODAL ELEMENT SELECTORS ---
    const projectModal = document.getElementById('project-info-modal');
    const closeModalBtn = projectModal.querySelector('.close-btn');
    const saveProjectInfoBtn = document.getElementById('save-project-info-btn');
    
    // --- INITIAL PAGE LOAD ---
    if (scheduleForm) {
        const contactInput = document.getElementById('scene-contact');
        loadScheduleData();
        if (contactInput) contactInput.value = lastContactPerson;
    }

    // --- EVENT LISTENERS ---
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });
    }

    document.addEventListener('click', (event) => {
        if (dropdownMenu && !dropdownMenu.contains(event.target) && !hamburgerBtn.contains(event.target)) {
            dropdownMenu.classList.remove('show');
        }
    });

    if (scheduleForm) {
        scheduleForm.addEventListener('submit', handleAddScene);
    }
    
    // Menu buttons
    if (newProjectBtn) newProjectBtn.addEventListener('click', openProjectModal);
    if (saveExcelBtn) saveExcelBtn.addEventListener('click', saveAsExcel);
    
    // Modal buttons
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeProjectModal);
    if (saveProjectInfoBtn) saveProjectInfoBtn.addEventListener('click', handleSaveProjectInfo);
    
    window.onclick = (event) => {
        if (event.target == projectModal) {
            closeProjectModal();
        }
    };
});


// =================================================================
// --- CORE SCHEDULE FUNCTIONS ---
// =================================================================

function handleAddScene(e) {
    e.preventDefault();
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
    
    lastContactPerson = newScene.contact;
    scheduleData.push(newScene);
    saveScheduleData();
    renderSchedule();
    
    e.target.reset(); // e.target refers to the form
    document.getElementById('scene-contact').value = lastContactPerson;
}

function renderSchedule() {
    const container = document.getElementById('scene-strips-container');
    if (!container) return;
    container.innerHTML = ''; 

    scheduleData.forEach(scene => {
        const stripWrapper = document.createElement('div');
        stripWrapper.className = 'scene-strip-wrapper';
        stripWrapper.dataset.id = scene.id;
        const statusClass = scene.status.toLowerCase();
        stripWrapper.innerHTML = `
            <div class="scene-strip" id="scene-strip-${scene.id}">
                <div class="strip-item"><strong>#${scene.number}</strong></div>
                <div class="strip-item">${scene.heading}</div>
                <div class="strip-item">${scene.date}</div>
                <div class="strip-item">${scene.time}</div>
                <div class="strip-item">${scene.type}. ${scene.location}</div>
                <div class="strip-item">Pages: <strong>${scene.pages || 'N/A'}</strong></div>
                <div class="strip-item">Duration: <strong>${scene.duration || 'N/A'}</strong></div>
                <div class="strip-item"><span class="strip-status ${statusClass}">${scene.status}</span></div>
            </div>
            <div class="scene-actions">
                <button class="share-btn-strip" title="Share as Image"><i class="fas fa-share-alt"></i></button>
                <button class="btn-danger" title="Delete Scene"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        stripWrapper.querySelector('.btn-danger').addEventListener('click', () => deleteScene(scene.id));
        stripWrapper.querySelector('.share-btn-strip').addEventListener('click', () => shareScene(scene.id));
        container.appendChild(stripWrapper);
    });
}

function deleteScene(id) {
    if (confirm('Are you sure you want to delete this scene?')) {
        scheduleData = scheduleData.filter(scene => scene.id !== id);
        saveScheduleData();
        renderSchedule();
    }
}

// =================================================================
// --- DATA PERSISTENCE (localStorage) ---
// =================================================================

function saveScheduleData() {
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
}

function loadScheduleData() {
    const savedData = localStorage.getItem('scheduleData');
    scheduleData = savedData ? JSON.parse(savedData) : [];
    if (scheduleData.length > 0) {
        lastContactPerson = scheduleData[scheduleData.length - 1].contact || '';
    }
    renderSchedule();
}

// =================================================================
// --- NEW PROJECT INFO MODAL ---
// =================================================================

function openProjectModal() {
    const projectInfo = JSON.parse(localStorage.getItem('projectInfo')) || {};
    document.getElementById('prod-name').value = projectInfo.prodName || '';
    document.getElementById('director-name').value = projectInfo.directorName || '';
    document.getElementById('contact-number').value = projectInfo.contactNumber || '';
    document.getElementById('contact-email').value = projectInfo.contactEmail || '';
    document.getElementById('project-info-modal').style.display = 'block';
}

function closeProjectModal() {
    document.getElementById('project-info-modal').style.display = 'none';
}

function handleSaveProjectInfo() {
    const projectInfo = {
        prodName: document.getElementById('prod-name').value,
        directorName: document.getElementById('director-name').value,
        contactNumber: document.getElementById('contact-number').value,
        contactEmail: document.getElementById('contact-email').value
    };
    localStorage.setItem('projectInfo', JSON.stringify(projectInfo));
    closeProjectModal();
    alert('Project Info Saved!');
}

// =================================================================
// --- EXPORT & SHARE FUNCTIONS ---
// =================================================================

function saveAsExcel() {
    if (scheduleData.length === 0) {
        alert("No schedule data to export.");
        return;
    }
    // Convert data to a format suitable for Excel
    const worksheet = XLSX.utils.json_to_sheet(scheduleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shooting Schedule");
    // Trigger the download
    XLSX.writeFile(workbook, "ShootingSchedule.xlsx");
}

async function shareScene(id) {
    const template = document.getElementById('share-card-template');
    const scene = scheduleData.find(s => s.id === id); 
    const projectInfo = JSON.parse(localStorage.getItem('projectInfo')) || {};

    if (!template || !scene) return;

    // Build footer HTML
    let footerHtml = `
        <div class="footer-project-info">
            ${projectInfo.prodName ? `<div>${projectInfo.prodName}</div>` : ''}
            ${projectInfo.directorName ? `<div>Dir: ${projectInfo.directorName}</div>` : ''}
            ${projectInfo.contactNumber ? `<div>${projectInfo.contactNumber}</div>` : ''}
            ${projectInfo.contactEmail ? `<div>${projectInfo.contactEmail}</div>` : ''}
        </div>
        <div class="footer-brand">@Thosho Tech</div>
    `;

    template.innerHTML = `
        <div class="share-card-content">
            <div class="share-card-header">
                <h1>Scene #${scene.number}</h1>
                <h2>${scene.heading}</h2>
            </div>
            <p class="share-card-item"><strong>Date:</strong> ${scene.date}</p>
            <p class="share-card-item"><strong>Time:</strong> ${formatTime12Hour(scene.time)}</p>
            <p class="share-card-item"><strong>Location:</strong> ${scene.type}. ${scene.location}</p>
            <p class="share-card-item"><strong>Cast:</strong> ${scene.cast || 'N/A'}</p>
            <p class="share-card-item"><strong>Contact:</strong> 📞 ${scene.contact || 'N/A'}</p>
            <div class="share-card-footer">${footerHtml}</div>
        </div>
    `;

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
    } catch (error) {
        console.error('Sharing failed:', error);
    }
}

function formatTime12Hour(timeString) {
    if (!timeString) return "N/A";
    const [hour, minute] = timeString.split(':');
    const hourInt = parseInt(hour, 10);
    const ampm = hourInt >= 12 ? 'PM' : 'AM';
    const hour12 = hourInt % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
}
