document.addEventListener('DOMContentLoaded', () => {
    // --- REFERENCIAS A ELEMENTOS DEL DOM ---
    const body = document.body;
    const tabs = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const playerModal = document.getElementById('player-modal');
    const closeModalBtn = document.querySelector('.modal .close-button');
    const addPlayerBtn = document.getElementById('add-player-btn');
    const playerForm = document.getElementById('player-form');
    const playerListContainer = document.getElementById('player-list-container');
    const daySelector = document.getElementById('day-selector');
    const attendanceListContainer = document.getElementById('attendance-list-container');
    const summaryTableBody = document.querySelector('#summary-table tbody');
    const calculateCommissionsBtn = document.getElementById('calculate-commissions-btn');
    const commissionsResultsContainer = document.getElementById('commissions-results-container');
    const fortnightSelector = document.getElementById('fortnight-selector');
    const scheduleTimeSelect = document.getElementById('schedule-time');
    const adminLockBtn = document.getElementById('admin-lock-btn');
    const adminLockIcon = adminLockBtn.querySelector('i');

    // --- DASHBOARD & FILTROS ---
    const totalPlayersStat = document.getElementById('total-players-stat');
    const sergioClassesStat = document.getElementById('sergio-classes-stat');
    const luisClassesStat = document.getElementById('luis-classes-stat');
    const playersToRenewList = document.getElementById('players-to-renew-list');
    const paymentFilter = document.getElementById('payment-filter');
    const serviceTypeFilter = document.getElementById('service-type-filter');
    const applySummaryFiltersBtn = document.getElementById('apply-summary-filters');

    // --- ELEMENTOS DEL MODAL (JUGADOR) ---
    const mainServiceTypeSelect = document.getElementById('main-service-type');
    const academiaDetails = document.getElementById('step-academia-details');
    const individualDetails = document.getElementById('step-individual-details');
    const commonDetails = document.getElementById('step-common-details');
    const academyTypeSelect = document.getElementById('academy-type');
    const ageField = document.getElementById('age-field');
    const levelField = document.getElementById('level-field');
    const priceSummaryCard = document.getElementById('price-summary');
    const totalCostDisplay = document.getElementById('total-cost-display');
    const coachSelect = document.getElementById('coach-select');

    // --- ELEMENTOS DEL MODAL (ENTRENADOR) ---
    const coachModal = document.getElementById('coach-modal');
    const closeCoachModalBtn = coachModal.querySelector('.close-button');
    const manageCoachesBtn = document.getElementById('manage-coaches-btn');
    const coachForm = document.getElementById('coach-form');
    const coachListContainer = document.getElementById('coach-list-container');

    // --- ELEMENTOS DEL MODAL (CAMBIAR ENTRENADOR) ---
    const changeCoachModal = document.getElementById('change-coach-modal');
    const closeChangeCoachModalBtn = changeCoachModal.querySelector('.close-button');
    const changeCoachForm = document.getElementById('change-coach-form');
    const coachOverrideSelect = document.getElementById('coach-override-select');

    // **NUEVO**: Referencias al modal de edición de resumen
    const editSummaryModal = document.getElementById('edit-summary-modal');
    const editSummaryForm = document.getElementById('edit-summary-form');
    const closeEditSummaryModalBtn = editSummaryModal.querySelector('.close-button');

    // --- ESTADO DE LA APLICACIÓN ---
    let players = [];
    let coaches = [];
    let isAdmin = false;
    let isDataLoading = false;
    let lastDataState = '';

    // --- CONSTANTES ---
    const PRICES = {
        academia: { ninos: 1800, adultos: 2200 },
        individual: {
            unica: { 1: 600, 2: 800, 3: 900, 4: 1000 },
            paquete4: { 1: 2000, 2: 2700, 3: 3000, 4: 3400 }
        }
    };
    const ADMIN_PIN = "5858";
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxiVyICkhHFOzwWhsltcAWj46lKeweGSSiJNfSBjpCN_3lzuYDH4p_oY_-oe6I0FRX-/exec";

    const ICONS = {
        renew: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0112.548-3.364l1.903 1.903h-4.518a.75.75 0 00-.75.75v4.518l1.903-1.903a.75.75 0 00-1.18-1.181h-.002a6 6 0 10-9.28 4.903a.75.75 0 001.03-1.03A7.5 7.5 0 014.755 10.059z" clip-rule="evenodd" /></svg>`,
        whatsapp: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path d="M16.6 14.2l-.3-.1c-1.4-.7-2.8-1.4-4.2-2.1-.2-.1-.4 0-.6.1-.2.2-.4.4-.6.6-.2.2-.4.3-.7.2-.2-.1-.5-.2-.7-.3-.6-.2-1.1-.6-1.6-1-.5-.4-.9-.9-1.2-1.5-.1-.2-.1-.4 0-.6.1-.1.2-.2.3-.3.1-.1.2-.2.2-.4 0-.2 0-.4-.1-.6 0-.2-.1-.4-.1-.6l-.7-1.7c-.1-.2-.3-.4-.5-.4h-.3c-.2 0-.4 0-.6.1-.2.1-.4.3-.6.5-.2.2-.4.5-.5.8-.1.3-.2.6-.1.9.1.5.3 1 .6 1.5.3.5.7 1 1.1 1.5.8.9 1.7 1.7 2.8 2.3.7.4 1.4.7 2.2.9.2.1.4.1.6.1.2 0 .4 0 .6-.1.2-.1.4-.2.5-.3.2-.1.3-.3.4-.5.1-.2.2-.4.2-.6l-.1-.9c0-.2-.1-.4-.2-.5zM12 2a10 10 0 100 20 10 10 0 000-20zm0 18.5a8.5 8.5 0 110-17 8.5 8.5 0 010 17z" /></svg>`,
        edit: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-8.4 8.4a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32l8.4-8.4z" /><path d="M5.25 5.25a3 3 0 00-3 3v10.5a3 3 0 003 3h10.5a3 3 0 003-3V13.5a.75.75 0 00-1.5 0v5.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5V8.25a1.5 1.5 0 011.5-1.5h5.25a.75.75 0 000-1.5H5.25z" /></svg>`,
        delete: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.9h1.368c1.603 0 2.816 1.336 2.816 2.9zM12 3.25a.75.75 0 01.75.75v.008l.008-.008a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008l.008-.008a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008l.008-.008a.75.75 0 01.75-.75H12a.75.75 0 01-.75.75v-.008l-.008.008A.75.75 0 0112 3.25z" clip-rule="evenodd" /></svg>`,
        change: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icon-svg"><path fill-rule="evenodd" d="M15.97 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 11-1.06-1.06l3.22-3.22H7.5a.75.75 0 010-1.5h11.69l-3.22-3.22a.75.75 0 010-1.06zm-7.94 9a.75.75 0 010 1.06l-3.22 3.22H16.5a.75.75 0 010 1.5H4.81l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.5a.75.75 0 010-1.06l4.5-4.5a.75.75 0 011.06 0z" clip-rule="evenodd" /></svg>`
    };

    // --- FUNCIONES DE DATOS (CON GOOGLE SHEETS) ---
    async function loadData(isInitialLoad = false) {
        if (isDataLoading) return;
        isDataLoading = true;
        if (isInitialLoad) document.body.classList.add('saving');

        try {
            const response = await fetch(SCRIPT_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            const newDataState = JSON.stringify(data);
            if (newDataState === lastDataState && !isInitialLoad) return;
            lastDataState = newDataState;

            players = data.players || [];
            coaches = data.coaches || [];

            players.forEach(p => {
                p.id = parseInt(p.id, 10);
                p.paid = String(p.paid).toLowerCase() === 'true';
                p.manualClassAdjustment = parseInt(p.manualClassAdjustment, 10) || 0;
                p.attendance = p.attendance || [];
                p.historicalAttendance = p.historicalAttendance || [];

                if (p.schedule && typeof p.schedule === 'string' && p.schedule.startsWith("'")) {
                    p.schedule = p.schedule.substring(1);
                } else if (p.schedule && typeof p.schedule === 'string' && p.schedule.includes('T')) {
                    try {
                        const date = new Date(p.schedule);
                        const hours = String(date.getUTCHours()).padStart(2, '0');
                        p.schedule = `${hours}:00`;
                    } catch (e) { console.error(`Error al reparar horario para ${p.name}: ${p.schedule}`, e); }
                }
            });

            coaches.forEach(c => {
                c.id = parseInt(c.id, 10);
                c.commissionRate = parseFloat(c.commissionRate);
            });

            if (isInitialLoad) {
                initApp();
            } else {
                refreshAllViews();
            }
        } catch (error) {
            console.error("Error al cargar datos:", error);
            if (isInitialLoad) alert("No se pudieron cargar los datos.");
        } finally {
            isDataLoading = false;
            if (isInitialLoad) document.body.classList.remove('saving');
        }
    }

    async function saveData() {
        try {
            document.body.classList.add('saving');
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ players, coaches }),
            });
            setTimeout(() => loadData(), 1000);
        } catch (error) {
            console.error("Error al guardar datos:", error);
            alert("Error al guardar los datos.");
        } finally {
            setTimeout(() => document.body.classList.remove('saving'), 1500);
        }
    }

    // --- LÓGICA DE ADMIN ---
    const toggleAdminMode = () => {
        isAdmin = !isAdmin;
        body.classList.toggle('locked', !isAdmin);
        adminLockIcon.classList.toggle('fa-lock', !isAdmin);
        adminLockIcon.classList.toggle('fa-unlock', isAdmin);
        adminLockBtn.classList.toggle('unlocked', isAdmin);
        refreshAllViews();
    };

    const handleAdminLock = () => {
        if (isAdmin) {
            toggleAdminMode();
            return;
        }
        const pin = prompt("Introduce el PIN de administrador:");
        if (pin === ADMIN_PIN) toggleAdminMode();
        else if (pin) alert("PIN incorrecto.");
    };

    // --- LÓGICA DE ENTRENADORES ---
    const renderCoachesList = () => {
        coachListContainer.innerHTML = '';
        coaches.forEach(coach => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${coach.name} (${coach.commissionRate}%)</span><div class="coach-actions"><button class="action-button-small secondary-action edit-coach-btn" data-id="${coach.id}">${ICONS.edit}</button><button class="action-button-small danger-action delete-coach-btn" data-id="${coach.id}">${ICONS.delete}</button></div>`;
            coachListContainer.appendChild(li);
        });
        populateCoachSelect();
        populateCoachSelect(coachOverrideSelect);
    };
    const populateCoachSelect = (selectElement = coachSelect) => {
        const currentCoachValue = selectElement.value;
        selectElement.innerHTML = '<option value="" disabled>Selecciona...</option>';
        coaches.forEach(coach => {
            selectElement.innerHTML += `<option value="${coach.id}">${coach.name}</option>`;
        });
        selectElement.innerHTML += `<option value="Ambos">Ambos</option>`;
        selectElement.value = currentCoachValue;
    };
    const openCoachModal = (coach = null) => {
        coachForm.reset();
        coachForm.querySelector('#coach-id').value = '';
        if (coach) {
            coachForm.querySelector('#coach-id').value = coach.id;
            coachForm.querySelector('#coach-name').value = coach.name;
            coachForm.querySelector('#coach-commission').value = coach.commissionRate;
        }
        coachModal.style.display = 'block';
    };
    const openChangeCoachModal = (playerId, classDate) => {
        const player = players.find(p => p.id == playerId);
        const attendanceRecord = player.attendance.find(a => a.date === classDate);
        changeCoachForm.querySelector('#change-coach-player-id').value = playerId;
        changeCoachForm.querySelector('#change-coach-class-date').value = classDate;
        populateCoachSelect(coachOverrideSelect);
        coachOverrideSelect.value = attendanceRecord?.overrideCoachId || player.coachId;
        changeCoachModal.style.display = 'block';
    };

    // --- FUNCIONES DE FECHA ---
    const getWeekNumber = (d) => {
        d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return [d.getUTCFullYear(), weekNo];
    };
    const getDateForDayOfWeek = (dayOfWeek) => {
        const today = new Date();
        const currentDay = today.getDay();
        const dayOffset = currentDay === 0 ? 7 : currentDay;
        const targetDay = parseInt(dayOfWeek, 10);
        const targetOffset = targetDay === 0 ? 7 : targetDay;
        const dayDifference = targetOffset - dayOffset;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayDifference);
        return targetDate;
    };
    const populateFortnightSelector = () => {
        if (!fortnightSelector) return;
        fortnightSelector.innerHTML = '';
        const today = new Date();
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        for (let i = 0; i < 6; i++) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const month = date.getMonth();
            const year = date.getFullYear();
            const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
            const endSecond = new Date(year, month, lastDayOfMonth).toISOString().slice(0, 10);
            const startSecond = new Date(year, month, 16).toISOString().slice(0, 10);
            fortnightSelector.innerHTML += `<option value="${startSecond}_${endSecond}">16 al ${lastDayOfMonth} de ${monthNames[month]}, ${year}</option>`;
            const endFirst = new Date(year, month, 15).toISOString().slice(0, 10);
            const startFirst = new Date(year, month, 1).toISOString().slice(0, 10);
            fortnightSelector.innerHTML += `<option value="${startFirst}_${endFirst}">1 al 15 de ${monthNames[month]}, ${year}</option>`;
        }
    };
    const formatSchedule = (scheduleString) => {
        if (typeof scheduleString === 'string' && /^\d{2}:\d{2}$/.test(scheduleString)) {
            const [startHourStr] = scheduleString.split(':');
            const startHour = parseInt(startHourStr, 10);
            const endHour = startHour + 1;
            return `${scheduleString} a ${String(endHour).padStart(2, '0')}:00`;
        }
        return scheduleString;
    };
    
    // --- LÓGICA DE ASISTENCIA ---
    const archiveOldAttendance = () => {
        const [currentYear, currentWeek] = getWeekNumber(new Date());
        let needsSave = false;
        players.forEach(player => {
            const recordsToArchive = player.attendance.filter(att => {
                const recordDate = new Date(att.date + "T12:00:00Z");
                const [recordYear, recordWeek] = getWeekNumber(recordDate);
                return recordYear !== currentYear || recordWeek !== currentWeek;
            });

            if (recordsToArchive.length > 0) {
                recordsToArchive.forEach(recordToArchive => {
                    if (!player.historicalAttendance.some(h => h.date === recordToArchive.date)) {
                        player.historicalAttendance.push(recordToArchive);
                    }
                });
                player.attendance = player.attendance.filter(att => !recordsToArchive.find(r => r.date === att.date));
                needsSave = true;
            }
        });
        if (needsSave) {
            console.log("Asistencias de semanas pasadas archivadas.");
            saveData();
        }
    };

    const getRemainingClasses = (player) => {
        if (player.mainServiceType !== 'academia' && player.individualType !== 'paquete4') return Infinity;
        
        const allAttendance = [...player.attendance, ...player.historicalAttendance];
        const packageSize = player.individualType === 'paquete4' ? 4 : 8;
        
        const absences = allAttendance.filter(a => a.status === 'falta').length;
        const effectiveAbsences = player.mainServiceType === 'academia' ? Math.min(absences, 2) : absences;
        const attendedClasses = allAttendance.filter(a => a.status === 'presente').length;
        
        const classesUsed = attendedClasses + effectiveAbsences;
        
        return packageSize + (player.manualClassAdjustment || 0) - classesUsed;
    };

    // --- FUNCIONES DE RENDERIZADO Y LÓGICA PRINCIPAL ---
    const renderDashboard = () => {
        totalPlayersStat.textContent = players.length;
        playersToRenewList.innerHTML = '';
        const playersToRenew = players.filter(p => getRemainingClasses(p) <= 2);
        if (playersToRenew.length > 0) {
            playersToRenew.sort((a,b) => getRemainingClasses(a) - getRemainingClasses(b)).forEach(p => {
                const li = document.createElement('li');
                li.textContent = `${p.name} - Quedan ${getRemainingClasses(p)} clases`;
                playersToRenewList.appendChild(li);
            });
        } else {
            playersToRenewList.innerHTML = '<li>No hay jugadores por renovar.</li>';
        }

        const today = new Date();
        const startQuincena = new Date(today.getFullYear(), today.getMonth(), today.getDate() <= 15 ? 1 : 16);
        const endQuincena = new Date(today.getFullYear(), today.getMonth(), today.getDate() <= 15 ? 15 : new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());

        let classesCount = {};
        coaches.forEach(c => { classesCount[c.name] = 0; });
        
        players.forEach(player => {
            [...player.attendance, ...player.historicalAttendance].forEach(att => {
                const attDate = new Date(att.date + 'T12:00:00Z');
                if (att.status === 'presente' && attDate >= startQuincena && attDate <= endQuincena) {
                    const coachId = att.overrideCoachId || player.coachId;
                    if (coachId === 'Ambos' && coaches.length >= 2) {
                        if(classesCount[coaches[0].name] !== undefined) classesCount[coaches[0].name] += 0.5;
                        if(classesCount[coaches[1].name] !== undefined) classesCount[coaches[1].name] += 0.5;
                    } else {
                         const coach = coaches.find(c => c.id == coachId);
                         if (coach && classesCount[coach.name] !== undefined) {
                            classesCount[coach.name]++;
                         }
                    }
                }
            });
        });
        sergioClassesStat.textContent = Math.round(classesCount['Sergio'] || 0);
        luisClassesStat.textContent = Math.round(classesCount['Luis'] || 0);
    };

    const renderPlayersList = () => {
        playerListContainer.innerHTML = '';
        if (players.length === 0) {
            playerListContainer.innerHTML = '<li>No hay jugadores registrados.</li>';
            return;
        }

        players.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
            const li = document.createElement('li');
            let details = '';
            if (player.mainServiceType === 'academia') {
                details = `Academia ${player.academyType === 'ninos' ? `Niños (Edad: ${player.age})` : `Adultos (Nivel: ${player.level})`}`;
            } else {
                details = `Clase Individual (${player.individualType === 'unica' ? 'Única' : 'Paquete 4'}) - ${player.numPeople} persona(s)`;
            }

            let coachName = "No asignado";
            if (player.coachId === 'Ambos') {
                coachName = 'Ambos';
            } else {
                const coach = coaches.find(c => c.id == player.coachId);
                if (coach) coachName = coach.name;
            }

            const phoneInfo = player.phone ? ` | 📞 ${player.phone}` : '';

            li.innerHTML = `
                <div class="player-info">
                    <strong>${player.name}</strong>
                    <span>${details}</span>
                    <span>Horario: ${formatSchedule(player.schedule)} - Entrenador: ${coachName}${phoneInfo}</span>
                </div>
                <div class="player-actions admin-feature">
                    <button class="action-button-small secondary-action edit-btn" data-id="${player.id}">${ICONS.edit}</button>
                    <button class="action-button-small danger-action delete-btn" data-id="${player.id}">${ICONS.delete}</button>
                </div>
            `;
            playerListContainer.appendChild(li);
        });
        body.classList.toggle('locked', !isAdmin);
    };

    const renderAttendanceList = () => {
        const selectedDay = daySelector.value;
        const selectedDate = getDateForDayOfWeek(selectedDay);
        const selectedDateStr = selectedDate.toISOString().slice(0, 10);

        const playersForDay = players.filter(p => (p.classDays || []).includes(selectedDay));
        attendanceListContainer.innerHTML = '';

        if (playersForDay.length === 0) {
            attendanceListContainer.innerHTML = '<h3>No hay clases programadas para este día.</h3>';
            return;
        }

        const groupedBySchedule = playersForDay.reduce((acc, player) => {
            const scheduleKey = player.schedule || "Sin horario";
            (acc[scheduleKey] = acc[scheduleKey] || []).push(player);
            return acc;
        }, {});

        Object.keys(groupedBySchedule).sort().forEach(schedule => {
            const scheduleContainer = document.createElement('div');
            const formattedDate = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            scheduleContainer.innerHTML = `<h3>Horario ${formatSchedule(schedule)} <span class="attendance-date">(${formattedDate})</span></h3>`;

            groupedBySchedule[schedule].sort((a,b) => a.name.localeCompare(b.name)).forEach(player => {
                const attendanceRecord = player.attendance.find(a => a.date === selectedDateStr);
                
                const coachForThisClassId = attendanceRecord?.overrideCoachId || player.coachId;
                let coachName = "No asignado";
                if (coachForThisClassId === 'Ambos') coachName = 'Ambos';
                else {
                    const coach = coaches.find(c => c.id == coachForThisClassId);
                    if (coach) coachName = coach.name;
                }
                
                const card = document.createElement('div');
                card.className = 'player-attendance-card';

                card.innerHTML = `
                    <div class="player-attendance-info">
                        <strong>${player.name}</strong>
                        <div class="attendance-coach">
                            <span>${coachName}</span>
                            <button class="action-button-small edit-class-coach-btn admin-feature" data-player-id="${player.id}" data-class-date="${selectedDateStr}">${ICONS.change}</button>
                        </div>
                    </div>
                    <div class="attendance-actions">
                        <button class="action-button-small present-btn ${attendanceRecord?.status === 'presente' ? 'active' : ''}" data-player-id="${player.id}" data-status="presente">Presente</button>
                        <button class="action-button-small absent-btn ${attendanceRecord?.status === 'falta' ? 'active' : ''}" data-player-id="${player.id}" data-status="falta">Falta</button>
                    </div>
                `;
                scheduleContainer.appendChild(card);
            });
            attendanceListContainer.appendChild(scheduleContainer);
        });
        body.classList.toggle('locked', !isAdmin);
    };

    const renderSummaryTable = () => {
        summaryTableBody.innerHTML = '';
        let filteredPlayers = [...players];

        const serviceType = serviceTypeFilter.value;
        if (serviceType !== 'todos') {
            filteredPlayers = filteredPlayers.filter(p => p.mainServiceType === serviceType);
        }
        const payment = paymentFilter.value;
        if (payment !== 'todos') {
            filteredPlayers = filteredPlayers.filter(p => (p.paid && payment === 'pagado') || (!p.paid && payment === 'pendiente'));
        }

        if (filteredPlayers.length === 0) {
            summaryTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay jugadores que coincidan.</td></tr>';
            return;
        }

        filteredPlayers.sort((a,b) => a.name.localeCompare(b.name)).forEach(player => {
            const remaining = getRemainingClasses(player);
            const row = document.createElement('tr');
            if ((player.mainServiceType === 'academia' || player.individualType === 'paquete4') && remaining <= 2) {
                row.classList.add('low-classes');
            }

            let detailsText = `Clase Individual (Única)`;
            if (player.mainServiceType === 'academia' || player.individualType === 'paquete4') {
                 detailsText = `Clases Restantes: ${remaining}`;
            }

            const paymentDate = player.paid && player.paymentDate ? new Date(player.paymentDate + "T12:00:00Z").toLocaleDateString('es-ES') : '';
            const paymentText = player.paid ? `Pagado <span class="payment-date">(${paymentDate})</span>` : 'Pendiente';

            let actionsHtml = '';
            if (player.mainServiceType === 'academia' || player.individualType === 'paquete4') {
                if (remaining <= 1 && player.phone) {
                    actionsHtml += `<button class="action-button-small whatsapp-btn" data-name="${player.name}" data-phone="${player.phone}">${ICONS.whatsapp}</button>`;
                }
                actionsHtml += `<button class="action-button-small renew-package-btn" data-id="${player.id}">${ICONS.renew}</button>`;
                actionsHtml += `<button class="action-button-small secondary-action edit-classes-btn" data-id="${player.id}">${ICONS.edit}</button>`;
            }
            actionsHtml += `<button class="action-button-small danger-action delete-summary-btn" data-id="${player.id}">${ICONS.delete}</button>`;

            row.innerHTML = `
                <td data-label="Jugador">${player.name}</td>
                <td data-label="Detalle">${detailsText}</td>
                <td data-label="Estado del Pago"><button class="payment-status-btn ${player.paid ? 'pagado' : 'pendiente'}" data-id="${player.id}">${paymentText}</button></td>
                <td data-label="Acciones" class="admin-feature summary-actions">${actionsHtml}</td>
            `;
            summaryTableBody.appendChild(row);
        });

        body.classList.toggle('locked', !isAdmin);
    };

    const renderCommissions = () => {
        const selectedFortnight = fortnightSelector.value;
        if (!selectedFortnight) {
            commissionsResultsContainer.innerHTML = '<p>Por favor, selecciona un periodo.</p>';
            return;
        }

        const [startDate, endDate] = selectedFortnight.split('_');

        let commissions = {};
        coaches.forEach(c => { commissions[c.id] = { name: c.name, total: 0, rate: c.commissionRate, classesTaught: [] }; });

        players.forEach(player => {
            const paidInPeriod = player.paid && player.paymentDate >= startDate && player.paymentDate <= endDate;
            if (paidInPeriod) {
                const price = calculatePrice(player);
                const classDetail = {
                    playerName: player.name,
                    classType: player.mainServiceType === 'academia' ? `Academia ${player.academyType}` : `Individual ${player.individualType}`,
                    price: price
                };

                const coachIdForCommission = player.coachId; 

                if (coachIdForCommission === 'Ambos' && coaches.length >= 2) {
                    const coach1 = coaches[0]; const coach2 = coaches[1];
                    const commission1 = price * (coach1.commissionRate / 100) / 2;
                    const commission2 = price * (coach2.commissionRate / 100) / 2;

                    if (commissions[coach1.id]) {
                        commissions[coach1.id].total += commission1;
                        commissions[coach1.id].classesTaught.push({ ...classDetail, commission: commission1 });
                    }
                    if (commissions[coach2.id]) {
                        commissions[coach2.id].total += commission2;
                        commissions[coach2.id].classesTaught.push({ ...classDetail, commission: commission2 });
                    }
                } else {
                    const coach = coaches.find(c => c.id == coachIdForCommission);
                    if (coach && commissions[coach.id]) {
                        const commissionAmount = price * (coach.commissionRate / 100);
                        commissions[coach.id].total += commissionAmount;
                        commissions[coach.id].classesTaught.push({ ...classDetail, commission: commissionAmount });
                    }
                }
            }
        });

        commissionsResultsContainer.innerHTML = '';
        Object.values(commissions).forEach(data => {
            let classesList = data.classesTaught.map(cls => 
                `<li>${cls.playerName} (${cls.classType}) - Comisión: $${cls.commission.toFixed(2)}</li>`
            ).join('');

            commissionsResultsContainer.innerHTML += `<div class="commission-card"><h3>${data.name}</h3><p><strong>Comisión Total:</strong> $${data.total.toFixed(2)} MXN</p><h4>Clases Pagadas en Periodo:</h4><ul class="commission-detail-list">${classesList || '<li>Ninguna.</li>'}</ul></div>`;
        });
    };

    const calculatePrice = (data) => {
        try {
            if (data.mainServiceType === 'academia') return PRICES.academia[data.academyType] || 0;
            else if (data.mainServiceType === 'individual') return PRICES.individual[data.individualType][data.numPeople || 1] || 0;
        } catch (e) { return 0; }
        return 0;
    };
    const updatePriceSummary = () => {
        const formData = {
            mainServiceType: document.getElementById('main-service-type').value,
            academyType: document.getElementById('academy-type').value,
            individualType: document.getElementById('individual-type').value,
            numPeople: parseInt(document.getElementById('num-people').value) || 1,
        };
        const price = calculatePrice(formData);
        priceSummaryCard.classList.toggle('hidden', price <= 0);
        totalCostDisplay.textContent = `$${price.toFixed(2)} MXN`;
    };
    const handleModalForm = () => {
        const mainService = mainServiceTypeSelect.value;
        academiaDetails.classList.toggle('hidden', mainService !== 'academia');
        individualDetails.classList.toggle('hidden', mainService !== 'individual');
        commonDetails.classList.toggle('hidden', !mainService);
        if (mainService === 'academia') handleAcademyType();
        updatePriceSummary();
    };
    const handleAcademyType = () => {
        const academyType = academyTypeSelect.value;
        ageField.classList.toggle('hidden', academyType !== 'ninos');
        levelField.classList.toggle('hidden', academyType !== 'adultos');
        updatePriceSummary();
    };
    const refreshAllViews = () => {
        const activeTab = document.querySelector('.nav-button.active')?.dataset.tab;
        if(activeTab === 'inicio') renderDashboard();
        if(activeTab === 'registro') renderPlayersList();
        if(activeTab === 'asistencia') renderAttendanceList();
        if(activeTab === 'resumen') renderSummaryTable();
    };

    // --- MANEJADORES DE EVENTOS ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            tabContents.forEach(content => content.classList.toggle('active', content.id === `${target}-tab`));
            refreshAllViews(); 
        });
    });

    const openPlayerModal = (player = null) => {
        playerForm.reset();
        document.getElementById('player-id').value = '';
        document.getElementById('modal-title').textContent = player ? 'Editar Jugador' : 'Registrar Nuevo Jugador';
        populateCoachSelect(); 
        if (player) {
            document.getElementById('player-id').value = player.id;
            document.getElementById('player-name').value = player.name;
            document.getElementById('player-phone').value = player.phone || '';
            document.getElementById('main-service-type').value = player.mainServiceType;
            if (player.mainServiceType === 'academia') {
                document.getElementById('academy-type').value = player.academyType;
                if (player.academyType === 'ninos') document.getElementById('player-age').value = player.age;
                else document.getElementById('player-level').value = player.level;
            } else {
                document.getElementById('individual-type').value = player.individualType;
                document.getElementById('num-people').value = player.numPeople;
            }
            coachSelect.value = player.coachId;
            scheduleTimeSelect.value = player.schedule;
            document.querySelectorAll('input[name="class-day"]').forEach(cb => {
                const classDays = Array.isArray(player.classDays) ? player.classDays : [];
                cb.checked = classDays.includes(cb.value);
            });
        }
        handleModalForm();
        playerModal.style.display = 'block';
    };
    const openEditSummaryModal = (player) => {
        document.getElementById('edit-summary-player-id').value = player.id;
        document.getElementById('edit-summary-title').textContent = `Editar Paquete de ${player.name}`;
        document.getElementById('edit-remaining-classes').value = getRemainingClasses(player);
        document.getElementById('edit-payment-date').value = player.paymentDate || new Date().toISOString().slice(0, 10);
        editSummaryModal.style.display = 'block';
    };

    addPlayerBtn.addEventListener('click', () => openPlayerModal());
    closeModalBtn.addEventListener('click', () => playerModal.style.display = 'none');
    closeEditSummaryModalBtn.addEventListener('click', () => editSummaryModal.style.display = 'none');
    playerForm.addEventListener('change', updatePriceSummary);
    mainServiceTypeSelect.addEventListener('change', handleModalForm);
    academyTypeSelect.addEventListener('change', handleAcademyType);
    adminLockBtn.addEventListener('click', handleAdminLock);
    applySummaryFiltersBtn.addEventListener('click', renderSummaryTable);
    manageCoachesBtn.addEventListener('click', () => openCoachModal());
    closeCoachModalBtn.addEventListener('click', () => coachModal.style.display = 'none');

    coachForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('coach-id').value;
        const coachData = {
            name: document.getElementById('coach-name').value,
            commissionRate: parseFloat(document.getElementById('coach-commission').value)
        };
        if(id) {
            const index = coaches.findIndex(c => c.id == id);
            coaches[index] = { ...coaches[index], ...coachData };
        } else {
            coaches.push({ ...coachData, id: Date.now() });
        }
        saveData();
        renderCoachesList();
        coachForm.reset();
        document.getElementById('coach-id').value = '';
    });

    coachListContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if(!target) return;
        const id = target.dataset.id;
        if(target.classList.contains('edit-coach-btn')) {
            openCoachModal(coaches.find(c => c.id == id));
        }
        if(target.classList.contains('delete-coach-btn')) {
            if(confirm('¿Seguro que quieres eliminar a este entrenador?')) {
                coaches = coaches.filter(c => c.id != id);
                saveData();
                renderCoachesList();
            }
        }
    });

    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('player-id').value;
        const playerData = {
            name: document.getElementById('player-name').value,
            phone: document.getElementById('player-phone').value,
            mainServiceType: document.getElementById('main-service-type').value,
            academyType: document.getElementById('academy-type').value,
            age: document.getElementById('player-age').value,
            level: document.getElementById('player-level').value,
            individualType: document.getElementById('individual-type').value,
            numPeople: parseInt(document.getElementById('num-people').value),
            coachId: coachSelect.value,
            schedule: "'" + scheduleTimeSelect.value,
            classDays: Array.from(document.querySelectorAll('input[name="class-day"]:checked')).map(cb => cb.value),
        };
        if (id) {
            const playerIndex = players.findIndex(p => p.id == id);
            if (playerData.schedule.startsWith("''")) playerData.schedule = playerData.schedule.substring(1);
            players[playerIndex] = { ...players[playerIndex], ...playerData };
        } else {
            players.push({ ...playerData, id: Date.now(), attendance: [], historicalAttendance: [], paid: false, paymentDate: null, manualClassAdjustment: 0 });
        }
        saveData();
        refreshAllViews();
        playerModal.style.display = 'none';
    });

    playerListContainer.addEventListener('click', (e) => {
        if (!isAdmin) return;
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;
        if (target.classList.contains('edit-btn')) {
            openPlayerModal(players.find(p => p.id == id));
        }
        if (target.classList.contains('delete-btn')) {
            if (confirm('¿Estás seguro?')) {
                players = players.filter(p => p.id != id);
                saveData();
                refreshAllViews();
            }
        }
    });

    daySelector.addEventListener('change', renderAttendanceList);

    attendanceListContainer.addEventListener('click', (e) => {
        if (!isAdmin) return;
        const button = e.target.closest('button');
        if (!button) return;

        const playerId = button.dataset.playerId;
        
        if (button.classList.contains('edit-class-coach-btn')) {
            const classDate = button.dataset.classDate;
            openChangeCoachModal(playerId, classDate);
            return;
        }

        if (button.classList.contains('present-btn') || button.classList.contains('absent-btn')) {
            const newStatus = button.dataset.status;
            const player = players.find(p => p.id == playerId);
            const selectedDateStr = getDateForDayOfWeek(daySelector.value).toISOString().slice(0, 10);
            let attendanceRecord = player.attendance.find(a => a.date === selectedDateStr);

            if (attendanceRecord) {
                if (attendanceRecord.status === newStatus) {
                    player.attendance = player.attendance.filter(a => a.date !== selectedDateStr);
                } else {
                    attendanceRecord.status = newStatus;
                }
            } else {
                player.attendance.push({ date: selectedDateStr, status: newStatus });
            }
            
            if (getRemainingClasses(player) <= 0) {
                player.paid = false;
                player.paymentDate = null;
            }

            saveData();
            refreshAllViews();
        }
    });

    summaryTableBody.addEventListener('click', (e) => {
        if (!isAdmin) return;
        const target = e.target.closest('button');
        if (!target) return;

        const id = target.dataset.id;
        const player = players.find(p => p.id == id);

        if (target.classList.contains('payment-status-btn')) {
            player.paid = !player.paid;
            player.paymentDate = player.paid ? new Date().toISOString().slice(0, 10) : null;
            saveData();
            refreshAllViews();
        } else if (target.classList.contains('edit-classes-btn')) {
            openEditSummaryModal(player);
        } else if (target.classList.contains('renew-package-btn')) {
            const remaining = getRemainingClasses(player);
            player.attendance = []; 
            player.historicalAttendance = [];
            player.manualClassAdjustment = 0;
            player.paid = true;
            player.paymentDate = new Date().toISOString().slice(0, 10);
            saveData();
            refreshAllViews();
        } else if (target.classList.contains('delete-summary-btn')) {
            if(confirm(`¿Seguro que quieres eliminar a ${player.name}?`)) {
                players = players.filter(p => p.id != id);
                saveData();
                refreshAllViews();
            }
        } else if (target.classList.contains('whatsapp-btn')) {
            const phone = target.dataset.phone;
            const name = target.dataset.name;
            const message = `¡Hola ${name}! 🎾 Notamos que te queda 1 clase en tu paquete. ¡Sigue mejorando tu juego con nuestro paquete de clases! 💪 ¿Deseas renovar?`;
            window.open(`https://wa.me/52${phone}?text=${encodeURIComponent(message)}`, '_blank');
        }
    });

    editSummaryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const playerId = document.getElementById('edit-summary-player-id').value;
        const player = players.find(p => p.id == playerId);
        if (player) {
            const newAmount = parseInt(document.getElementById('edit-remaining-classes').value, 10);
            const newDateStr = document.getElementById('edit-payment-date').value;

            if (!isNaN(newAmount)) {
                const totalAttendance = [...player.attendance, ...player.historicalAttendance];
                const packageSize = player.individualType === 'paquete4' ? 4 : 8;
                const absences = totalAttendance.filter(a => a.status === 'falta').length;
                const effectiveAbsences = player.mainServiceType === 'academia' ? Math.min(absences, 2) : absences;
                const attendedClasses = totalAttendance.filter(a => a.status === 'presente').length;
                const classesUsed = attendedClasses + effectiveAbsences;

                player.manualClassAdjustment = newAmount - (packageSize - classesUsed);
            }
            if (newDateStr) {
                player.paymentDate = newDateStr;
                player.paid = true;
            }
            saveData();
            refreshAllViews();
            editSummaryModal.style.display = 'none';
        }
    });

    calculateCommissionsBtn.addEventListener('click', renderCommissions);
    closeChangeCoachModalBtn.addEventListener('click', () => changeCoachModal.style.display = 'none');
    changeCoachForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const playerId = document.getElementById('change-coach-player-id').value;
        const classDate = document.getElementById('change-coach-class-date').value;
        const newCoachId = coachOverrideSelect.value;
        const player = players.find(p => p.id == playerId);
        let attendanceRecord = player.attendance.find(a => a.date === classDate);
        if (!attendanceRecord) {
            player.attendance.push({ date: classDate, status: 'presente', overrideCoachId: newCoachId });
        } else {
            attendanceRecord.overrideCoachId = newCoachId;
        }
        saveData();
        renderAttendanceList();
        changeCoachModal.style.display = 'none';
    });

    // --- INICIALIZACIÓN ---
    const initApp = () => {
        if (coaches.length === 0) {
            coaches = [
                { id: 1, name: 'Sergio', commissionRate: 33 },
                { id: 2, name: 'Luis', commissionRate: 33 }
            ];
        }
        for (let i = 8; i <= 23; i++) {
            scheduleTimeSelect.add(new Option(`${String(i).padStart(2, '0')}:00`, `${String(i).padStart(2, '0')}:00`));
        }
        let todayDay = new Date().getDay();
        daySelector.value = todayDay === 0 ? '0' : todayDay.toString();
        
        archiveOldAttendance();

        renderCoachesList();
        populateFortnightSelector();
        document.querySelector('.nav-button[data-tab="inicio"]').click();
        setInterval(() => loadData(false), 20000); 
    };

    loadData(true);
});
