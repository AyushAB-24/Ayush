// Initialize data
let subjects = ["Theory 1", "Theory 2", "Theory 3", "Theory 4", "Theory 5", "Theory 6", "Lab 1", "Lab 2", "Lab 3"];
let attendance = {};
let calendar = {};
let attendanceRecords = {};
let currentEditingSubject = null;
let currentCalendarSubject = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Load from localStorage if available
function loadData() {
    const savedSubjects = localStorage.getItem('subjects');
    const savedAttendance = localStorage.getItem('attendanceData');
    const savedCalendar = localStorage.getItem('calendarData');
    const savedRecords = localStorage.getItem('attendanceRecords');
    
    if (savedSubjects) {
        subjects = JSON.parse(savedSubjects);
    }
    
    if (savedAttendance) {
        attendance = JSON.parse(savedAttendance);
        subjects.forEach(subject => {
            if (!attendance[subject]) {
                attendance[subject] = { attended: 0, total: 0 };
            }
        });
    } else {
        subjects.forEach(subject => {
            attendance[subject] = { attended: 0, total: 0 };
        });
    }
    
    if (savedCalendar) {
        calendar = JSON.parse(savedCalendar);
        subjects.forEach(subject => {
            if (!calendar[subject]) {
                calendar[subject] = {};
            }
        });
    } else {
        subjects.forEach(subject => {
            calendar[subject] = {};
        });
    }
    
    if (savedRecords) {
        attendanceRecords = JSON.parse(savedRecords);
        subjects.forEach(subject => {
            if (!attendanceRecords[subject]) {
                attendanceRecords[subject] = [];
            }
        });
    } else {
        subjects.forEach(subject => {
            attendanceRecords[subject] = [];
        });
    }
}

// Save to localStorage
function saveData() {
    localStorage.setItem('subjects', JSON.stringify(subjects));
    localStorage.setItem('attendanceData', JSON.stringify(attendance));
    localStorage.setItem('calendarData', JSON.stringify(calendar));
    localStorage.setItem('attendanceRecords', JSON.stringify(attendanceRecords));
}

// Generate calendar HTML for a subject
function generateCalendar(subject) {
    currentCalendarSubject = subject;
    let content = document.getElementById('calendar-content');
    content.innerHTML = '';
    
    // Add current date indicator
    const today = new Date();
    const todayStr = formatDate(today);
    const currentDateDisplay = document.createElement('div');
    currentDateDisplay.className = 'current-date';
    currentDateDisplay.innerHTML = `<i class="fas fa-calendar-day"></i> Today: ${todayStr}`;
    content.appendChild(currentDateDisplay);
    
    // Add status indicator if marking attendance
    const status = document.getElementById('calendar-modal').getAttribute('data-status');
    if (status) {
        let statusDisplay = document.createElement('div');
        statusDisplay.className = `status-indicator ${status}-status`;
        statusDisplay.innerHTML = `
            <i class="fas ${status === 'present' ? 'fa-check-circle' : 'fa-times-circle'}"></i>
            Tap a date to mark as ${status}
        `;
        content.appendChild(statusDisplay);
    }
    
    // Create navigation controls
    const navControls = document.createElement('div');
    navControls.className = 'calendar-nav';
    
    const prevBtn = document.createElement('button');
    prevBtn.className = 'calendar-nav-btn ripple';
    prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevBtn.onclick = () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        generateCalendar(subject);
    };
    
    const nextBtn = document.createElement('button');
    nextBtn.className = 'calendar-nav-btn ripple';
    nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextBtn.onclick = () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        generateCalendar(subject);
    };
    
    const monthTitle = document.createElement('div');
    monthTitle.className = 'month-title';
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const todayBtn = document.createElement('button');
    todayBtn.className = 'today-btn ripple';
    todayBtn.textContent = 'Today';
    todayBtn.onclick = () => {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
        generateCalendar(subject);
    };
    
    navControls.appendChild(prevBtn);
    navControls.appendChild(monthTitle);
    navControls.appendChild(nextBtn);
    navControls.appendChild(todayBtn);
    content.appendChild(navControls);
    
    // Create month calendar
    const monthContent = document.createElement('div');
    monthContent.className = 'month-calendar';
    
    // Days header
    const daysHeader = document.createElement('div');
    daysHeader.className = 'days-header';
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = day;
        daysHeader.appendChild(dayHeader);
    });
    monthContent.appendChild(daysHeader);
    
    // Days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'days-grid';
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay.getDay(); i++) {
        const empty = document.createElement('div');
        empty.className = 'day-cell empty';
        daysGrid.appendChild(empty);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatDate(date);
        const dayCell = document.createElement('div');
        dayCell.className = 'day-cell ripple';
        dayCell.textContent = day;
        
        // Highlight current day
        const today = new Date();
        if (date.getDate() === today.getDate() && 
            date.getMonth() === today.getMonth() && 
            date.getFullYear() === today.getFullYear()) {
            dayCell.classList.add('today');
        }
        
        // Check if this date is marked
        if (calendar[subject][dateStr]) {
            dayCell.classList.add(calendar[subject][dateStr] + '-day');
        }
        
        dayCell.onclick = function() {
            const currentStatus = document.getElementById('calendar-modal').getAttribute('data-status');
            if (currentStatus) {
                markDate(subject, dateStr, currentStatus);
                // Add visual feedback
                this.classList.add('active');
                setTimeout(() => {
                    this.classList.remove('active');
                }, 200);
            }
        };
        
        daysGrid.appendChild(dayCell);
    }
    
    monthContent.appendChild(daysGrid);
    content.appendChild(monthContent);
    
    // Add attendance records
    const recordsDiv = document.createElement('div');
    recordsDiv.className = 'records-list';
    
    const recordsTitle = document.createElement('div');
    recordsTitle.className = 'records-title';
    recordsTitle.innerHTML = `
        <i class="fas fa-history"></i>
        Attendance History
    `;
    recordsDiv.appendChild(recordsTitle);
    
    const recordsList = document.createElement('div');
    
    // Sort records by date (newest first)
    const sortedRecords = [...attendanceRecords[subject]].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sortedRecords.length === 0) {
        recordsList.innerHTML = '<p style="text-align: center; color: var(--gray); padding: 20px 0;">No records yet</p>';
    } else {
        sortedRecords.forEach(record => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            recordItem.innerHTML = `
                <span class="record-date">${record.date}</span>
                <span class="record-status record-status-${record.status}">
                    ${record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                </span>
            `;
            recordsList.appendChild(recordItem);
        });
    }
    
    recordsDiv.appendChild(recordsList);
    content.appendChild(recordsDiv);
    
    // Add swipe functionality for month navigation
    setupSwipeNavigation();
}

function setupSwipeNavigation() {
    let startX = 0;
    let endX = 0;
    const calendarContent = document.getElementById('calendar-content');
    
    calendarContent.addEventListener('touchstart', (e) => {
        startX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    calendarContent.addEventListener('touchend', (e) => {
        endX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const threshold = 50; // Minimum swipe distance
        if (startX - endX > threshold) {
            // Swipe left - next month
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateCalendar(currentCalendarSubject);
        } else if (endX - startX > threshold) {
            // Swipe right - previous month
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateCalendar(currentCalendarSubject);
        }
    }
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function markAttendance(subject, status) {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    openModal('calendar', subject, status);
}

function openModal(modal, subject = null, status = null) {
    const overlay = document.getElementById(`${modal}-overlay`);
    const modalElement = document.getElementById(`${modal}-modal`);
    
    overlay.style.display = 'block';
    modalElement.style.display = 'block';
    
    // Trigger animations
    setTimeout(() => {
        overlay.classList.add('active');
        modalElement.classList.add('active');
    }, 10);
    
    if (modal === 'calendar') {
        document.getElementById('calendar-title').textContent = subject;
        if (status) {
            document.getElementById('calendar-modal').setAttribute('data-status', status);
        } else {
            document.getElementById('calendar-modal').removeAttribute('data-status');
        }
        generateCalendar(subject);
    } else if (modal === 'delete-subject') {
        // Populate the delete subject modal with subject list
        const subjectListDiv = document.getElementById('subject-list-to-delete');
        subjectListDiv.innerHTML = '';
        
        subjects.forEach(subject => {
            const subjectBtn = document.createElement('button');
            subjectBtn.className = 'btn-delete ripple';
            subjectBtn.style.width = '100%';
            subjectBtn.style.marginBottom = '8px';
            subjectBtn.innerHTML = `<i class="fas fa-trash"></i> ${subject}`;
            subjectBtn.onclick = () => removeSubject(subject);
            subjectListDiv.appendChild(subjectBtn);
        });
    }
}

function openModalFromSettings(modal) {
    closeModal('settings');
    setTimeout(() => {
        openModal(modal);
    }, 300);
}

function closeModal(modal) {
    const overlay = document.getElementById(`${modal}-overlay`);
    const modalElement = document.getElementById(`${modal}-modal`);
    
    overlay.classList.remove('active');
    modalElement.classList.remove('active');
    
    setTimeout(() => {
        overlay.style.display = 'none';
        modalElement.style.display = 'none';
    }, 300);
    
    // Clear input fields when closing add subject modal
    if (modal === 'add-subject') {
        document.getElementById('new-subject-input').value = '';
    }
    
    // Reset calendar to current month when closing
    if (modal === 'calendar') {
        const today = new Date();
        currentMonth = today.getMonth();
        currentYear = today.getFullYear();
    }
}

function markDate(subject, date, status) {
    if (!status) return;
    
    // Check if this date is already marked
    const previousStatus = calendar[subject][date];
    
    // Update calendar data
    calendar[subject][date] = status;
    
    // Update attendance counts
    if (previousStatus === 'present') {
        attendance[subject].attended--;
    } else if (previousStatus === 'absent') {
        // No change to attended count
    } else {
        // New date being marked
        attendance[subject].total++;
    }
    
    if (status === 'present') {
        attendance[subject].attended++;
    }
    
    // Update attendance records
    if (previousStatus) {
        // Remove old record if exists
        attendanceRecords[subject] = attendanceRecords[subject].filter(r => r.date !== date);
    }
    
    // Add new record
    attendanceRecords[subject].push({
        date: date,
        status: status,
        timestamp: new Date().toISOString()
    });
    
    updateDisplay();
    saveData();
    
    // Show confirmation
    showSnackbar(`Marked as ${status} for ${date}`);
    
    // If we were marking a specific status, close the calendar
    if (document.getElementById('calendar-modal').getAttribute('data-status')) {
        setTimeout(() => {
            closeModal('calendar');
        }, 500);
    } else {
        // Otherwise just refresh the calendar view
        generateCalendar(subject);
    }
}

function updateDisplay() {
    let display = '';
    subjects.forEach((subject, index) => {
        const total = attendance[subject].total;
        const attended = attendance[subject].attended;
        const absent = total - attended;
        const percent = total > 0 ? (attended / total * 100).toFixed(1) : 0;
        let needed = 0;
        
        // Calculate how many more classes needed for 75%
        while (total > 0 && (attended + needed) / (total + needed) * 100 < 75) {
            needed++;
        }
        
        const percentageClass = percent >= 75 ? 'good-attendance' : 
                               percent >= 50 ? 'warning-attendance' : 'bad-attendance';
        
        display += `
            <div class="subject-card" style="animation-delay: ${index * 0.05}s">
                <div class="subject-header">
                    <h3 class="subject-title">${subject}</h3>
                    <button class="btn-edit ripple" onclick="editSubject('${subject}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
                
                <div class="attendance-percentage ${percentageClass}">
                    <i class="fas ${percent >= 75 ? 'fa-check-circle' : 'fa-chart-line'}"></i>
                    ${percent}% Attendance
                </div>
                
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${Math.min(percent, 100)}%"></div>
                </div>
                
                <div class="attendance-stats">
                    <div class="stat">
                        <span>Present</span>
                        <span class="stat-value present-stat">${attended}</span>
                    </div>
                    <div class="stat">
                        <span>Absent</span>
                        <span class="stat-value absent-stat">${absent}</span>
                    </div>
                    <div class="stat">
                        <span>Total</span>
                        <span class="stat-value total-stat">${total}</span>
                    </div>
                </div>
                
                ${percent < 75 && total > 0 ? `
                    <div class="warning-attendance">
                        <i class="fas fa-exclamation-circle"></i>
                        Need ${needed} more ${needed === 1 ? 'class' : 'classes'} for 75%
                    </div>
                ` : ''}
                
                <div class="action-buttons">
                    <button class="btn-present ripple" onclick="markAttendance('${subject}', 'present')">
                        <i class="fas fa-check"></i> Present
                    </button>
                    <button class="btn-absent ripple" onclick="markAttendance('${subject}', 'absent')">
                        <i class="fas fa-times"></i> Absent
                    </button>
                    <button class="btn-calendar ripple" onclick="openModal('calendar', '${subject}')">
                        <i class="fas fa-calendar-alt"></i> Calendar
                    </button>
                    <button class="btn-undo ripple" onclick="undoAttendance('${subject}')">
                        <i class="fas fa-undo"></i> Undo
                    </button>
                </div>
            </div>
        `;
    });
    document.getElementById('subjects').innerHTML = display;
    
    // Add ripple effects to all buttons
    setupRippleEffects();
}

function undoAttendance(subject) {
    if (attendanceRecords[subject].length > 0) {
        // Get the most recent record
        const lastRecord = attendanceRecords[subject].sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        
        // Remove from calendar
        delete calendar[subject][lastRecord.date];
        
        // Update attendance counts
        attendance[subject].total--;
        if (lastRecord.status === 'present') {
            attendance[subject].attended--;
        }
        
        // Remove from records
        attendanceRecords[subject] = attendanceRecords[subject].filter(
            r => r.timestamp !== lastRecord.timestamp
        );
        
        updateDisplay();
        saveData();
        showSnackbar(`Undid ${lastRecord.status} for ${lastRecord.date}`);
    } else {
        showSnackbar('No attendance to undo');
    }
}

function editSubject(subject) {
    currentEditingSubject = subject;
    document.getElementById('edit-subject-input').value = subject;
    openModal('edit');
    setTimeout(() => {
        document.getElementById('edit-subject-input').focus();
    }, 300);
}

function saveSubjectName() {
    const newName = document.getElementById('edit-subject-input').value.trim();
    if (newName && currentEditingSubject) {
        // Check if this is a rename (not just same name)
        if (newName !== currentEditingSubject) {
            // Update all data structures
            const index = subjects.indexOf(currentEditingSubject);
            if (index !== -1) {
                subjects[index] = newName;
            }
            
            // Update attendance data
            if (attendance[currentEditingSubject]) {
                attendance[newName] = attendance[currentEditingSubject];
                delete attendance[currentEditingSubject];
            }
            
            // Update calendar data
            if (calendar[currentEditingSubject]) {
                calendar[newName] = calendar[currentEditingSubject];
                delete calendar[currentEditingSubject];
            }
            
            // Update records
            if (attendanceRecords[currentEditingSubject]) {
                attendanceRecords[newName] = attendanceRecords[currentEditingSubject];
                delete attendanceRecords[currentEditingSubject];
            }
            
            saveData();
            updateDisplay();
            showSnackbar('Subject renamed successfully');
        }
    }
    closeModal('edit');
}

// Add new subject function
function addNewSubject() {
    const subjectName = document.getElementById('new-subject-input').value.trim();
    if (subjectName && !subjects.includes(subjectName)) {
        subjects.push(subjectName);
        attendance[subjectName] = { attended: 0, total: 0 };
        calendar[subjectName] = {};
        attendanceRecords[subjectName] = [];
        
        saveData();
        updateDisplay();
        closeModal('add-subject');
        showSnackbar('Subject added successfully');
    } else if (subjects.includes(subjectName)) {
        showSnackbar('This subject already exists!');
    }
}

// Remove subject function
function removeSubject(subject) {
    if (confirm(`Are you sure you want to remove "${subject}" and all its attendance data?`)) {
        // Remove from subjects array
        const index = subjects.indexOf(subject);
        if (index !== -1) {
            subjects.splice(index, 1);
        }
        
        // Remove from attendance data
        if (attendance[subject]) {
            delete attendance[subject];
        }
        
        // Remove from calendar data
        if (calendar[subject]) {
            delete calendar[subject];
        }
        
        // Remove from records
        if (attendanceRecords[subject]) {
            delete attendanceRecords[subject];
        }
        
        saveData();
        updateDisplay();
        closeModal('delete-subject');
        showSnackbar('Subject removed successfully');
    }
}

// Scroll to top function
function scrollToTop() {
    document.getElementById('app-content').scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/hide floating action button based on scroll position
function handleScroll() {
    const fab = document.getElementById('fab');
    if (document.getElementById('app-content').scrollTop > 300) {
        fab.classList.add('visible');
    } else {
        fab.classList.remove('visible');
    }
}

// Show snackbar notification
function showSnackbar(message) {
    const snackbar = document.getElementById('snackbar');
    snackbar.textContent = message;
    snackbar.classList.add('show');
    
    setTimeout(() => {
        snackbar.classList.remove('show');
    }, 3000);
}

// Setup ripple effects for buttons
function setupRippleEffects() {
    const buttons = document.querySelectorAll('.ripple');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Remove any existing ripple effects
            const existingRipples = this.querySelectorAll('.ripple-effect');
            existingRipples.forEach(ripple => ripple.remove());
            
            // Create new ripple
            const ripple = document.createElement('span');
            ripple.className = 'ripple-effect';
            
            // Position the ripple
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size/2}px`;
            ripple.style.top = `${e.clientY - rect.top - size/2}px`;
            
            this.appendChild(ripple);
            
            // Remove ripple after animation
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateDisplay();
    setupRippleEffects();
    
    // Handle keyboard for edit modal
    document.getElementById('edit-subject-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            saveSubjectName();
        }
    });
    
    // Handle keyboard for add subject modal
    document.getElementById('new-subject-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addNewSubject();
        }
    });
    
    // Add scroll event listener
    document.getElementById('app-content').addEventListener('scroll', handleScroll);
    
    // Show FAB after initial load
    setTimeout(() => {
        const fab = document.getElementById('fab');
        fab.classList.add('visible');
    }, 1000);
});