// Configuración de Firebase
const firebaseConfig = {
    databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Referencias a Firebase
const usersRef = database.ref('login');
const activeUsersRef = database.ref('uactivos');
const modulesRef = database.ref('modules');
const accessRef = database.ref('accesos');

// Variables globales
let systemModules = [];
let roleAccess = {};
let userRole = '';

// Lista de iconos FontAwesome comunes
const commonIcons = [
    'fa-users', 'fa-user-tie', 'fa-clipboard-check', 'fa-clipboard-list', 
    'fa-database', 'fa-folder-tree', 'fa-bug', 'fa-list-check', 'fa-flask', 
    'fa-spray-can', 'fa-eye', 'fa-user-check', 'fa-shrimp', 'fa-project-diagram', 
    'fa-magnifying-glass', 'fa-droplet', 'fa-cloud-rain', 'fa-file-lines', 
    'fa-chart-bar', 'fa-cog', 'fa-wrench', 'fa-tools', 'fa-chart-line', 
    'fa-chart-pie', 'fa-table', 'fa-map', 'fa-map-marker', 'fa-calendar', 
    'fa-clock', 'fa-bell', 'fa-envelope', 'fa-inbox', 'fa-box', 'fa-pallet', 
    'fa-truck', 'fa-warehouse', 'fa-seedling', 'fa-leaf', 'fa-tree', 
    'fa-tint', 'fa-cloud-sun', 'fa-temperature-high', 'fa-weight-hanging', 
    'fa-ruler', 'fa-flask', 'fa-vial', 'fa-microscope', 'fa-prescription-bottle', 
    'fa-pump-medical', 'fa-syringe', 'fa-pills', 'fa-first-aid', 'fa-heartbeat', 
    'fa-laptop', 'fa-mobile', 'fa-tablet', 'fa-print', 'fa-server', 'fa-hdd', 
    'fa-microchip', 'fa-memory', 'fa-desktop', 'fa-keyboard', 'fa-mouse', 
    'fa-network-wired', 'fa-wifi', 'fa-bluetooth', 'fa-broadcast-tower', 
    'fa-satellite', 'fa-satellite-dish', 'fa-shield-alt', 'fa-lock', 
    'fa-unlock', 'fa-key', 'fa-fingerprint', 'fa-id-card', 'fa-passport', 
    'fa-credit-card', 'fa-money-bill', 'fa-money-bill-wave', 'fa-money-check', 
    'fa-calculator', 'fa-percentage', 'fa-receipt', 'fa-shopping-cart', 
    'fa-store', 'fa-tag', 'fa-tags', 'fa-gift', 'fa-award', 'fa-trophy', 
    'fa-medal', 'fa-crown', 'fa-star', 'fa-flag', 'fa-bookmark', 'fa-heart', 
    'fa-thumbs-up', 'fa-thumbs-down', 'fa-comment', 'fa-comments', 'fa-quote-left'
];

// Elementos del DOM para la administración
const rolesList = document.getElementById('rolesList');
const selectedRoleSpan = document.getElementById('selectedRole');
const modulesGrid = document.getElementById('modulesGrid');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const addModuleBtn = document.getElementById('addModuleBtn');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const moduleModal = document.getElementById('moduleModal');
const closeModal = document.getElementById('closeModal');
const cancelModal = document.getElementById('cancelModal');
const moduleForm = document.getElementById('moduleForm');
const modalTitle = document.getElementById('modalTitle');
const moduleIdInput = document.getElementById('moduleId');
const moduleTitleInput = document.getElementById('moduleTitle');
const moduleDescriptionInput = document.getElementById('moduleDescription');
const moduleIconInput = document.getElementById('moduleIcon');
const moduleLinkInput = document.getElementById('moduleLink');
const iconsGrid = document.getElementById('iconsGrid');
const iconSearch = document.getElementById('iconSearch');
const iconPreview = document.getElementById('iconPreview');

// Rol actualmente seleccionado
let currentRole = 'Administrador';
let editingModuleId = null;

// Cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('agroalpha-theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
}

// Cargar datos del usuario en los componentes
async function loadUserDataInComponents(userData) {
    const headerComponent = document.querySelector('header-component');
    const sidebarComponent = document.querySelector('sidebar-component');
    
    console.log('Cargando datos del usuario en componentes:', userData);
    
    if (headerComponent && headerComponent.loadUserData) {
        try {
            await headerComponent.loadUserData(userData.username);
            console.log('✅ Datos cargados en header');
        } catch (error) {
            console.error('Error cargando datos en header:', error);
            if (headerComponent.updateUserInfo) {
                headerComponent.updateUserInfo(userData);
            }
        }
    }
    
    if (sidebarComponent && sidebarComponent.loadUserData) {
        try {
            await sidebarComponent.loadUserData(userData.username);
            console.log('✅ Datos cargados en sidebar');
        } catch (error) {
            console.error('Error cargando datos en sidebar:', error);
            if (sidebarComponent.updateUserInfo) {
                sidebarComponent.updateUserInfo(userData);
            }
        }
    }
}

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar tema primero
    loadSavedTheme();
    
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!userData || !userData.username) {
        window.location.href = 'index.html';
        return;
    }
    
    // Guardar el rol del usuario
    userRole = userData.role;
    
    // Configurar eventos de logout
    document.addEventListener('logout', logout);
    
    // Verificar si el usuario sigue activo en uactivos
    activeUsersRef.child(userData.username).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                logout();
                return;
            }
            
            // Cargar datos del usuario en los componentes
            loadUserDataInComponents(userData);
            
            // Cargar datos de Firebase para la administración
            loadFirebaseData();
        })
        .catch(error => {
            console.error('Error verificando sesión activa:', error);
            
            // Intentar cargar datos del usuario aunque falle la verificación
            loadUserDataInComponents(userData);
        });
});

// Cargar datos desde Firebase
function loadFirebaseData() {
    // Cargar módulos y accesos en paralelo
    Promise.all([
        modulesRef.once('value'),
        accessRef.once('value')
    ])
    .then(([modulesSnapshot, accessSnapshot]) => {
        // Procesar módulos
        if (modulesSnapshot.exists()) {
            const modulesData = modulesSnapshot.val();
            
            if (Array.isArray(modulesData)) {
                systemModules = modulesData;
            } else if (typeof modulesData === 'object' && modulesData !== null) {
                systemModules = Object.values(modulesData);
            } else {
                systemModules = [];
            }
            
            console.log('Módulos cargados:', systemModules);
        } else {
            console.error('No se encontraron módulos en Firebase');
            systemModules = [];
        }
        
        // Procesar accesos
        if (accessSnapshot.exists()) {
            roleAccess = accessSnapshot.val();
            console.log('Accesos cargados:', roleAccess);
        } else {
            console.error('No se encontraron accesos en Firebase');
            roleAccess = {};
        }
        
        // Inicializar la página de administración
        initAdminPage();
    })
    .catch(error => {
        console.error('Error cargando datos de Firebase:', error);
        showNotification('Error al cargar los datos. Intente recargar la página.', 'error');
    });
}

// Inicializar la página de administración
function initAdminPage() {
    // Configurar event listeners
    rolesList.addEventListener('click', function(e) {
        if (e.target.classList.contains('role-item')) {
            selectRole(e.target.dataset.role);
        } else if (e.target.parentElement.classList.contains('role-item')) {
            selectRole(e.target.parentElement.dataset.role);
        }
    });
    
    saveBtn.addEventListener('click', saveAccess);
    resetBtn.addEventListener('click', resetAccess);
    addModuleBtn.addEventListener('click', openAddModuleModal);
    closeModal.addEventListener('click', closeModuleModal);
    cancelModal.addEventListener('click', closeModuleModal);
    moduleForm.addEventListener('submit', saveModule);
    iconSearch.addEventListener('input', filterIcons);
    
    // Cerrar modal al hacer clic fuera del contenido
    moduleModal.addEventListener('click', function(e) {
        if (e.target === moduleModal) {
            closeModuleModal();
        }
    });
    
    // Renderizar iconos
    renderIcons();
    
    // Renderizar módulos para el rol actual
    renderModules(currentRole);
}

// Renderizar iconos en el grid
function renderIcons() {
    iconsGrid.innerHTML = '';
    
    commonIcons.forEach(icon => {
        const iconOption = document.createElement('div');
        iconOption.className = 'icon-option';
        iconOption.innerHTML = `<i class="fas ${icon}"></i>`;
        iconOption.dataset.icon = icon;
        
        iconOption.addEventListener('click', () => {
            selectIcon(icon);
        });
        
        iconsGrid.appendChild(iconOption);
    });
}

// Filtrar iconos según la búsqueda
function filterIcons() {
    const searchTerm = iconSearch.value.toLowerCase();
    const iconOptions = iconsGrid.querySelectorAll('.icon-option');
    
    iconOptions.forEach(option => {
        const iconName = option.dataset.icon.toLowerCase();
        if (iconName.includes(searchTerm)) {
            option.style.display = 'block';
        } else {
            option.style.display = 'none';
        }
    });
}

// Seleccionar un icono
function selectIcon(icon) {
    moduleIconInput.value = icon;
    iconPreview.className = `fas ${icon}`;
    
    // Resaltar el icono seleccionado
    const iconOptions = iconsGrid.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        if (option.dataset.icon === icon) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Seleccionar un rol
function selectRole(role) {
    currentRole = role;
    
    // Actualizar UI
    document.querySelectorAll('.role-item').forEach(item => {
        if (item.dataset.role === role) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    selectedRoleSpan.textContent = role;
    renderModules(role);
}

// Renderizar módulos para el rol seleccionado
function renderModules(role) {
    modulesGrid.innerHTML = '';
    
    // Obtener accesos para este rol
    const accessForRole = roleAccess[role] || {};
    
    // Generar tarjetas para los módulos
    systemModules.forEach(module => {
        const isEnabled = accessForRole[module.id] || false;
        
        const moduleCard = document.createElement('div');
        moduleCard.className = 'module-card';
        moduleCard.innerHTML = `
            <i class="fas fa-times delete-module" data-module="${module.id}"></i>
            <div class="module-header">
                <div class="module-icon"><i class="fas ${module.icon}"></i></div>
                <div class="module-title">${module.title}</div>
            </div>
            <div class="module-description">${module.description}</div>
            <div class="module-link">${module.link}</div>
            <div class="module-actions">
                <span>${isEnabled ? 'Habilitado' : 'Deshabilitado'}</span>
                <label class="toggle-switch">
                    <input type="checkbox" ${isEnabled ? 'checked' : ''} data-module="${module.id}">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        
        // Agregar evento para editar módulo al hacer doble clic
        moduleCard.addEventListener('dblclick', () => {
            editModule(module.id);
        });
        
        // Agregar evento para eliminar módulo
        const deleteBtn = moduleCard.querySelector('.delete-module');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteModule(module.id);
        });
        
        modulesGrid.appendChild(moduleCard);
    });
}

// Guardar accesos en Firebase
function saveAccess() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    
    // Inicializar objeto para este rol si no existe
    if (!roleAccess[currentRole]) {
        roleAccess[currentRole] = {};
    }
    
    // Actualizar accesos según las casillas verificadas
    checkboxes.forEach(checkbox => {
        const moduleId = checkbox.dataset.module;
        roleAccess[currentRole][moduleId] = checkbox.checked;
    });
    
    // Guardar en Firebase
    accessRef.set(roleAccess)
        .then(() => {
            showNotification('Accesos actualizados correctamente para ' + currentRole);
        })
        .catch(error => {
            console.error('Error guardando accesos:', error);
            showNotification('Error al guardar accesos: ' + error.message, 'error');
        });
}

// Restablecer accesos a los valores predeterminados
function resetAccess() {
    if (confirm(`¿Estás seguro de que deseas restablecer los accesos para ${currentRole} a los valores predeterminados?`)) {
        // Eliminar accesos personalizados para este rol
        delete roleAccess[currentRole];
        
        // Guardar en Firebase
        accessRef.set(roleAccess)
            .then(() => {
                renderModules(currentRole);
                showNotification('Accesos restablecidos para ' + currentRole);
            })
            .catch(error => {
                console.error('Error guardando accesos:', error);
                showNotification('Error al restablecer accesos: ' + error.message, 'error');
            });
    }
}

// Abrir modal para agregar módulo
function openAddModuleModal() {
    editingModuleId = null;
    modalTitle.textContent = 'Agregar Nuevo Módulo';
    moduleForm.reset();
    moduleIdInput.value = '';
    iconPreview.className = '';
    iconSearch.value = '';
    filterIcons();
    
    // Limpiar selección de iconos
    const iconOptions = iconsGrid.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    moduleModal.style.display = 'flex';
}

// Editar módulo existente
function editModule(moduleId) {
    const module = systemModules.find(m => m.id === moduleId);
    if (!module) return;
    
    editingModuleId = moduleId;
    modalTitle.textContent = 'Editar Módulo';
    moduleIdInput.value = module.id;
    moduleTitleInput.value = module.title;
    moduleDescriptionInput.value = module.description;
    moduleIconInput.value = module.icon;
    moduleLinkInput.value = module.link;
    
    // Mostrar vista previa del icono
    iconPreview.className = `fas ${module.icon}`;
    
    // Resaltar el icono seleccionado
    const iconOptions = iconsGrid.querySelectorAll('.icon-option');
    iconOptions.forEach(option => {
        if (option.dataset.icon === module.icon) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    iconSearch.value = '';
    filterIcons();
    
    moduleModal.style.display = 'flex';
}

// Cerrar modal
function closeModuleModal() {
    moduleModal.style.display = 'none';
    editingModuleId = null;
}

// Guardar módulo (nuevo o editado) en Firebase
function saveModule(e) {
    e.preventDefault();
    
    const title = moduleTitleInput.value.trim();
    const description = moduleDescriptionInput.value.trim();
    const icon = moduleIconInput.value.trim();
    const link = moduleLinkInput.value.trim();
    
    if (!title || !description || !icon || !link) {
        showNotification('Todos los campos son obligatorios', 'error');
        return;
    }
    
    // Generar ID si es un nuevo módulo
    const id = editingModuleId || generateModuleId(title);
    
    const newModule = {
        id,
        title,
        description,
        icon: icon.startsWith('fa-') ? icon : `fa-${icon}`,
        link: link.endsWith('.html') ? link : `${link}.html`
    };
    
    if (editingModuleId) {
        // Actualizar módulo existente
        const index = systemModules.findIndex(m => m.id === editingModuleId);
        if (index !== -1) {
            systemModules[index] = newModule;
        }
    } else {
        // Agregar nuevo módulo
        systemModules.push(newModule);
        
        // Agregar el nuevo módulo al administrador por defecto
        if (!roleAccess['Administrador']) {
            roleAccess['Administrador'] = {};
        }
        roleAccess['Administrador'][id] = true;
    }
    
    // Guardar en Firebase
    Promise.all([
        modulesRef.set(systemModules),
        accessRef.set(roleAccess)
    ])
    .then(() => {
        renderModules(currentRole);
        closeModuleModal();
        showNotification(`Módulo ${editingModuleId ? 'actualizado' : 'agregado'} correctamente`);
    })
    .catch(error => {
        console.error('Error guardando módulo:', error);
        showNotification('Error al guardar módulo: ' + error.message, 'error');
    });
}

// Eliminar módulo de Firebase
function deleteModule(moduleId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este módulo? Esto afectará los accesos de todos los roles.')) {
        return;
    }
    
    // Eliminar módulo de la lista
    systemModules = systemModules.filter(m => m.id !== moduleId);
    
    // Eliminar módulo de los accesos de todos los roles
    for (const role in roleAccess) {
        if (roleAccess[role][moduleId]) {
            delete roleAccess[role][moduleId];
        }
    }
    
    // Guardar en Firebase
    Promise.all([
        modulesRef.set(systemModules),
        accessRef.set(roleAccess)
    ])
    .then(() => {
        renderModules(currentRole);
        showNotification('Módulo eliminado correctamente');
    })
    .catch(error => {
        console.error('Error eliminando módulo:', error);
        showNotification('Error al eliminar módulo: ' + error.message, 'error');
    });
}

// Generar ID para módulo basado en el título
function generateModuleId(title) {
    return title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    notificationText.textContent = message;
    notification.className = 'notification';
    
    if (type === 'error') {
        notification.classList.add('error');
    } else if (type === 'warning') {
        notification.classList.add('warning');
    }
    
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Cerrar sesión
function logout() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (userData?.username) {
        // Eliminar de usuarios activos
        activeUsersRef.child(userData.username).remove()
            .then(() => {
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            })
            .catch(error => {
                console.error('Error al cerrar sesión:', error);
                sessionStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            });
    } else {
        sessionStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}