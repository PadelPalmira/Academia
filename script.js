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
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
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

    // --- FUNCIONES DE DATOS (CON GOOGLE SHEETS) ---
    async function loadData(isInitialLoad = false) {
        if (isDataLoading) {
            console.log("Carga de datos ya en progreso.");
            return;
        }
        isDataLoading = true;
        if (isInitialLoad) {
            document.body.classList.add('saving'); // Usar la clase 'saving' para mostrar un estado de carga inicial
        }

        try {
            const response = await fetch(SCRIPT_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            const newDataState = JSON.stringify(data);
            if (newDataState === lastDataState) {
                console.log("Sin cambios en los datos. No se requiere actualización.");
                return;
            }
            lastDataState = newDataState;
            
            players = data.players || [];
            coaches = data.coaches || [];
            
            // Forzar conversión de tipos de datos que vienen de Sheets
            players.forEach(p => {
                p.id = parseInt(p.id, 10);
                p.paid = String(p.paid).toLowerCase() === 'true';
                p.manualClassAdjustment = parseInt(p.manualClassAdjustment, 10) || 0;
            });
            coaches.forEach(c => {
                c.id = parseInt(c.id, 10);
                c.commissionRate = parseFloat(c.commissionRate);
            });
            console.log("Datos actualizados desde Google Sheets.");
            
            if (isInitialLoad) {
                initApp(); // Iniciar la app solo la primera vez
            } else {
                refreshAllViews(); // Refrescar vistas en cargas posteriores
            }

        } catch (error) {
            console.error("Error al cargar datos desde Google Sheets:", error);
            if(isInitialLoad) alert("No se pudieron cargar los datos. Revisa la URL del script y la configuración de permisos.");
        } finally {
            isDataLoading = false;
            if (isInitialLoad) {
                document.body.classList.remove('saving');
            }
        }
    }

    async function saveData() {
        try {
            document.body.classList.add('saving');
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ players, coaches }),
            });
            console.log("Datos enviados para guardar en Google Sheets.");
            // Forzar una recarga inmediata de los datos para confirmar el estado
            setTimeout(() => loadData(), 1000); 
        } catch (error) {
            console.error("Error al guardar datos en Google Sheets:", error);
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
        if (pin === ADMIN_PIN) {
            toggleAdminMode();
        } else if (pin) {
            alert("PIN incorrecto.");
        }
    };
    
    // --- LÓGICA DE ENTRENADORES ---
    const renderCoachesList = () => {
        coachListContainer.innerHTML = '';
        coaches.forEach(coach => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${coach.name} (${coach.commissionRate}%)</span>
                <div class="coach-actions">
                    <button class="action-button-small secondary-action edit-coach-btn" data-id="${coach.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="action-button-small danger-action delete-coach-btn" data-id="${coach.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            `;
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
        
        const currentCoachId = attendanceRecord?.overrideCoachId || player.coachId;
        coachOverrideSelect.value = currentCoachId;
        
        changeCoachModal.style.display = 'block';
    };


    // --- FUNCIONES DE FECHA ---
    const getDateForDayOfWeek = (dayOfWeek) => {
        const today = new Date();
        const currentDay = today.getDay();
        const targetDay = parseInt(dayOfWeek, 10);
        const dayOffset = currentDay === 0 ? 7 : currentDay;
        const targetOffset = targetDay === 0 ? 7 : targetDay;
        const dayDifference = targetOffset - dayOffset;
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayDifference);
        return targetDate;
    };

    // --- FUNCIONES DE RENDERIZADO Y LÓGICA ---
    const getRemainingClasses = (player) => {
        if (player.mainServiceType !== 'academia' && player.individualType !== 'paquete4') return Infinity;
        const packageSize = player.individualType === 'paquete4' ? 4 : 8;
        const absences = player.attendance.filter(a => a.status === 'falta').length;
        const effectiveAbsences = player.mainServiceType === 'academia' ? Math.min(absences, 2) : absences;
        const attendedClasses = player.attendance.filter(a => a.status === 'presente').length + (absences - effectiveAbsences);
        return packageSize + (player.manualClassAdjustment || 0) - attendedClasses;
    };

    const renderDashboard = () => {
        totalPlayersStat.textContent = players.length;
        playersToRenewList.innerHTML = '';
        const playersToRenew = players.filter(p => getRemainingClasses(p) <= 2);
        if (playersToRenew.length > 0) {
            playersToRenew.forEach(p => {
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
        coaches.forEach(c => { classesCount[c.name] = 0 });

        players.forEach(player => {
            player.attendance.forEach(att => {
                const attDate = new Date(att.date + 'T00:00:00');
                if (attDate >= startQuincena && attDate <= endQuincena) {
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

        players.forEach(player => {
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
                    <span>Horario: ${player.schedule} - Entrenador: ${coachName}${phoneInfo}</span>
                </div>
                <div class="player-actions admin-feature">
                    <button class="action-button-small secondary-action edit-btn" data-id="${player.id}"><i class="fa-solid fa-pen-to-square"></i> Editar</button>
                    <button class="action-button-small danger-action delete-btn" data-id="${player.id}"><i class="fa-solid fa-trash"></i> Eliminar</button>
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

        const playersForDay = players.filter(p => p.classDays.includes(selectedDay));
        attendanceListContainer.innerHTML = '';

        if (playersForDay.length === 0) {
            attendanceListContainer.innerHTML = '<h3>No hay clases programadas para este día.</h3>';
            return;
        }

        const groupedBySchedule = playersForDay.reduce((acc, player) => {
            (acc[player.schedule] = acc[player.schedule] || []).push(player);
            return acc;
        }, {});

        Object.keys(groupedBySchedule).sort().forEach(schedule => {
            const scheduleContainer = document.createElement('div');
            const formattedDate = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            scheduleContainer.innerHTML = `<h3>Horario: ${schedule} (${formattedDate})</h3>`;

            groupedBySchedule[schedule].forEach(player => {
                const attendanceRecord = player.attendance.find(a => a.date === selectedDateStr);
                const statusClass = attendanceRecord ? (attendanceRecord.status === 'presente' ? 'presente' : 'falta') : '';
                const card = document.createElement('div');
                card.className = `player-attendance-card`;
                
                const cardInfo = document.createElement('div');
                cardInfo.className = `player-attendance-info ${statusClass}`;
                cardInfo.dataset.playerId = player.id;
                
                const coachForThisClassId = attendanceRecord?.overrideCoachId || player.coachId;
                let coachName = "No asignado";
                if (coachForThisClassId === 'Ambos') {
                    coachName = 'Ambos';
                } else {
                    const coach = coaches.find(c => c.id == coachForThisClassId);
                    if (coach) coachName = coach.name;
                }
                
                cardInfo.innerHTML = `
                    <strong>${player.name}</strong>
                    ${player.mainServiceType === 'academia' || player.individualType === 'paquete4' ? `<div class="faltas">Faltas: ${player.attendance.filter(a => a.status === 'falta').length}</div>` : ''}
                `;

                const coachDiv = document.createElement('div');
                coachDiv.className = 'attendance-coach';
                coachDiv.innerHTML = `
                    <span>${coachName}</span>
                    <button class="action-button-small edit-class-coach-btn admin-feature" data-player-id="${player.id}" data-class-date="${selectedDateStr}"><i class="fa-solid fa-right-left"></i></button>
                `;

                card.appendChild(cardInfo);
                card.appendChild(coachDiv);
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
            summaryTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay jugadores que coincidan con los filtros.</td></tr>';
            return;
        }

        filteredPlayers.forEach(player => {
            const remaining = getRemainingClasses(player);
            const row = document.createElement('tr');
            if ((player.mainServiceType === 'academia' || player.individualType === 'paquete4') && remaining <= 2) {
                row.classList.add('low-classes');
            }
            
            let detailsText = `Clase Individual (Única)`;
            if (player.mainServiceType === 'academia' || player.individualType === 'paquete4') {
                 detailsText = `Clases Restantes: ${remaining}`;
            }

            const paymentDate = player.paid && player.paymentDate ? new Date(player.paymentDate).toLocaleDateString('es-ES') : '';
            const paymentText = player.paid ? `Pagado <span class="payment-date">(${paymentDate})</span>` : 'Pendiente';
            
            let actionsHtml = '';
            if (player.mainServiceType === 'academia' || player.individualType === 'paquete4') {
                if (remaining === 1 && player.phone) {
                    actionsHtml += `<button class="action-button-small whatsapp-btn" data-name="${player.name}" data-phone="${player.phone}"><i class="fab fa-whatsapp"></i></button>`;
                }
                actionsHtml += `<button class="action-button-small secondary-action renew-package-btn" data-id="${player.id}">Renovar</button>`;
                actionsHtml += `<button class="action-button-small secondary-action edit-classes-btn" data-id="${player.id}"><i class="fa-solid fa-pen"></i></button>`;
            }
            actionsHtml += `<button class="action-button-small danger-action delete-summary-btn" data-id="${player.id}"><i class="fa-solid fa-trash"></i></button>`;

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
        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (!startDate || !endDate) {
            commissionsResultsContainer.innerHTML = '<p style="color: var(--functional-red);">Por favor, selecciona un rango de fechas.</p>';
            return;
        }
        
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
                    const coach1 = coaches[0];
                    const coach2 = coaches[1];
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

            commissionsResultsContainer.innerHTML += `
                <div class="commission-card">
                    <h3>${data.name}</h3>
                    <p><strong>Comisión Total:</strong> $${data.total.toFixed(2)} MXN</p>
                    <h4>Resumen de Clases Pagadas en Periodo:</h4>
                    <ul class="commission-detail-list">${classesList || '<li>No hay clases pagadas en este periodo.</li>'}</ul>
                </div>`;
        });
    };

    const calculatePrice = (data) => {
        try {
            if (data.mainServiceType === 'academia') {
                return PRICES.academia[data.academyType] || 0;
            } else if (data.mainServiceType === 'individual') {
                const numPeople = data.numPeople || 1;
                return PRICES.individual[data.individualType][numPeople] || 0;
            }
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

    const autoMarkAbsences = () => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const lastCheck = localStorage.getItem('lastAbsenceCheck');

        if (now.getHours() < 19 || lastCheck === todayStr) {
            return;
        }

        let updated = false;
        const todayDayOfWeek = now.getDay();

        players.forEach(p => {
            if (p.classDays.includes(String(todayDayOfWeek)) && !p.attendance.some(att => att.date === todayStr)) {
                p.attendance.push({ date: todayStr, status: 'falta' });
                updated = true;
            }
        });

        if(updated) {
            console.log('Faltas automáticas registradas.');
            saveData();
            refreshAllViews();
        }
        localStorage.setItem('lastAbsenceCheck', todayStr);
    };

    const refreshAllViews = () => {
        const activeTab = document.querySelector('.nav-button.active')?.dataset.tab;
        if(activeTab === 'inicio') renderDashboard();
        if(activeTab === 'registro') renderPlayersList();
        if(activeTab === 'asistencia') renderAttendanceList();
        if(activeTab === 'resumen') renderSummaryTable();
        // No es necesario refrescar entrenadores ya que los cambios se hacen en el modal
    };

    // --- MANEJADORES DE EVENTOS ---
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const target = tab.getAttribute('data-tab');
            tabContents.forEach(content => content.classList.toggle('active', content.id === `${target}-tab`));
            refreshAllViews(); // Refresca la vista de la pestaña activa
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

    addPlayerBtn.addEventListener('click', () => openPlayerModal());
    closeModalBtn.addEventListener('click', () => playerModal.style.display = 'none');

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
            schedule: scheduleTimeSelect.value,
            classDays: Array.from(document.querySelectorAll('input[name="class-day"]:checked')).map(cb => cb.value),
        };
        if (id) {
            const playerIndex = players.findIndex(p => p.id == id);
            players[playerIndex] = { ...players[playerIndex], ...playerData };
        } else {
            players.push({ ...playerData, id: Date.now(), attendance: [], paid: false, paymentDate: null, manualClassAdjustment: 0 });
        }
        saveData();
        renderPlayersList();
        renderDashboard();
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
                renderPlayersList();
                renderDashboard();
            }
        }
    });

    daySelector.addEventListener('change', renderAttendanceList);

    attendanceListContainer.addEventListener('click', (e) => {
        if (!isAdmin) return;

        const button = e.target.closest('button.edit-class-coach-btn');
        if (button) {
            const playerId = button.dataset.playerId;
            const classDate = button.dataset.classDate;
            openChangeCoachModal(playerId, classDate);
            return;
        }

        const cardInfo = e.target.closest('.player-attendance-info');
        if (cardInfo) {
            const player = players.find(p => p.id == cardInfo.dataset.playerId);
            const selectedDateStr = getDateForDayOfWeek(daySelector.value).toISOString().slice(0, 10);
            let attendanceRecord = player.attendance.find(a => a.date === selectedDateStr);

            if (attendanceRecord) {
                attendanceRecord.status = attendanceRecord.status === 'presente' ? 'falta' : 'presente';
            } else {
                player.attendance.push({ date: selectedDateStr, status: 'presente' });
            }

            if(getRemainingClasses(player) <= 0) {
                player.paid = false;
                player.paymentDate = null;
            }

            saveData();
            renderAttendanceList();
            renderDashboard();
            renderSummaryTable();
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
        } else if (target.classList.contains('edit-classes-btn')) {
            const currentClasses = getRemainingClasses(player);
            const newAmountStr = prompt(`Clases restantes actuales: ${currentClasses}.\nIntroduce el nuevo número de clases restantes para ${player.name}:`);
            if (newAmountStr !== null) {
                const newAmount = parseInt(newAmountStr, 10);
                if (!isNaN(newAmount)) {
                    const packageSize = player.individualType === 'paquete4' ? 4 : 8;
                    const absences = player.attendance.filter(a => a.status === 'falta').length;
                    const effectiveAbsences = player.mainServiceType === 'academia' ? Math.min(absences, 2) : absences;
                    const attendedClasses = player.attendance.filter(a => a.status === 'presente').length + (absences - effectiveAbsences);
                    player.manualClassAdjustment = newAmount - (packageSize - attendedClasses);
                }
            }
        } else if (target.classList.contains('renew-package-btn')) {
            const packageSize = player.individualType === 'paquete4' ? 4 : 8;
            player.manualClassAdjustment = (player.manualClassAdjustment || 0) + packageSize;
            player.paid = false;
            player.paymentDate = null;
             alert(`Paquete de ${player.name} renovado. Ahora tiene ${getRemainingClasses(player)} clases restantes.`);
        } else if (target.classList.contains('delete-summary-btn')) {
            if(confirm(`¿Seguro que quieres eliminar a ${player.name} de la lista?`)) {
                players = players.filter(p => p.id != id);
            }
        } else if (target.classList.contains('whatsapp-btn')) {
            const phone = target.dataset.phone;
            const name = target.dataset.name;
            const message = `¡Hola ${name}! 🎾 Notamos que te queda 1 clase en tu paquete de academia en Padel Palmira. ¡Has estado dando lo mejor en la cancha! 😎 Sigue mejorando tu juego con nuestro paquete de clases. 💪 ¿Deseas renovar tu paquete ahora?`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/52${phone}?text=${encodedMessage}`, '_blank');
        }

        saveData();
        renderSummaryTable();
        renderDashboard();
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
        // Esta función se llama después de que los datos iniciales se cargan
        if (coaches.length === 0) {
            coaches = [
                { id: 1, name: 'Sergio', commissionRate: 33 },
                { id: 2, name: 'Luis', commissionRate: 33 }
            ];
        }

        for (let i = 8; i <= 23; i++) { // Rango de horas extendido
            scheduleTimeSelect.add(new Option(`${String(i).padStart(2, '0')}:00`, `${String(i).padStart(2, '0')}:00`));
        }
        let todayDay = new Date().getDay();
        daySelector.value = todayDay === 0 ? '0' : todayDay.toString();

        renderCoachesList();
        document.querySelector('.nav-button[data-tab="inicio"]').click();

        // Inicia el polling para actualizaciones automáticas
        setInterval(() => loadData(false), 20000); // Actualiza cada 20 segundos

        // Comprobación de ausencias al inicio y luego periódicamente
        autoMarkAbsences();
        setInterval(autoMarkAbsences, 3600000); // Cada hora
    };

    // Iniciar la carga de datos al abrir la app
    loadData(true);
});
