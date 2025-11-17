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
let currentUsers = [];

// Elementos del DOM
const usersTableBody = document.getElementById('usersTableBody');
const searchInput = document.getElementById('searchInput');
const messageDiv = document.getElementById('message');

// Modal de confirmación
const modal = document.createElement('div');
modal.className = 'modal';
modal.innerHTML = `
    <div class="modal-content">
        <div class="modal-header">
            <h3>Confirmar Eliminación</h3>
            <span class="close-modal">&times;</span>
        </div>
        <p id="modalMessage">¿Estás seguro de que deseas eliminar este usuario?</p>
        <div class="modal-actions">
            <button class="btn btn-cancel" id="cancelDelete">Cancelar</button>
            <button class="btn btn-confirm" id="confirmDelete">Eliminar</button>
        </div>
    </div>
`;
document.body.appendChild(modal);

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
        window.location.href = '/index.html';
        return;
    }
    
    // Guardar el rol del usuario
    userRole = userData.role;
    
    // Configurar eventos de logout
    document.addEventListener('logout', logout);
    
    // Configurar eventos del modal
    setupModalEvents();
    
    // Verificar si el usuario sigue activo en uactivos
    activeUsersRef.child(userData.username).once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                logout();
                return;
            }
            
            // Cargar datos del usuario en los componentes
            loadUserDataInComponents(userData);
            
            // Cargar módulos para el menú
            loadModulesForMenu();
            
            // Cargar usuarios
            loadUsers();
        })
        .catch(error => {
            console.error('Error verificando sesión activa:', error);
            
            // Intentar cargar datos del usuario aunque falle la verificación
            loadUserDataInComponents(userData);
        });
});

// Configurar eventos del modal
function setupModalEvents() {
    const closeModal = modal.querySelector('.close-modal');
    const cancelDelete = modal.querySelector('#cancelDelete');
    const confirmDelete = modal.querySelector('#confirmDelete');
    
    closeModal.addEventListener('click', closeDeleteModal);
    cancelDelete.addEventListener('click', closeDeleteModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeDeleteModal();
        }
    });
    
    confirmDelete.addEventListener('click', executeUserDeletion);
}

// Cargar módulos para el menú
function loadModulesForMenu() {
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
        } else {
            systemModules = [];
        }
        
        // Procesar accesos
        if (accessSnapshot.exists()) {
            roleAccess = accessSnapshot.val();
        } else {
            roleAccess = {};
        }
        
        // Generar elementos de navegación en el menú lateral
        generateNavItems();
    })
    .catch(error => {
        console.error('Error cargando datos de Firebase:', error);
    });
}

// Obtener clase CSS para el badge según el rol
function getBadgeClass(role) {
    const roleClasses = {
        'Administrador': 'admin-badge',
        'Admin': 'admin-badge',
        'Gerente General': 'gerente-general-badge',
        'Gerente de Producción': 'gerente-produccion-badge',
        'Supervisor': 'supervisor-badge',
        'Jefe de Vivero': 'jefe-vivero-badge',
        'Grower': 'grower-badge',
        'Grower Junior': 'grower-junior-badge',
        'Digitador': 'digitador-badge',
        'Técnico Fitosanidad': 'fitosanidad-badge',
        'Fitosanidad': 'fitosanidad-badge',
        'Técnico Prácticas Culturales': 'culturales-badge',
        'Prácticas Culturales': 'culturales-badge',
        'Culturales': 'culturales-badge',
        'Técnico Riego': 'riego-badge',
        'Riego': 'riego-badge',
        'Mezclero Fitosanidad': 'mezclero-fitosanidad-badge',
        'Consultor': 'consultor-badge',
        'Usuario1': 'usuario1-badge',
        'Usuario2': 'usuario2-badge',
        'Usuario3': 'usuario3-badge',
        'Usuario4': 'usuario4-badge',
        'Invitado': 'invitado-badge'
    };
    return roleClasses[role] || 'default-badge';
}

// Generar elementos de navegación en el menú lateral
function generateNavItems() {
    const container = document.getElementById('modules-nav');
    
    // Verificar si tenemos los datos necesarios
    if (systemModules.length === 0 || Object.keys(roleAccess).length === 0) {
        container.innerHTML = '<div class="nav-item"><span>Sin módulos disponibles</span></div>';
        return;
    }
    
    // Obtener los accesos para el rol del usuario
    const userAccess = roleAccess[userRole];
    
    if (!userAccess) {
        container.innerHTML = '<div class="nav-item"><span>Sin módulos disponibles</span></div>';
        return;
    }
    
    // Filtrar módulos a los que el usuario tiene acceso
    const accessibleModules = [];
    
    systemModules.forEach(module => {
        if (!module || !module.id) return;
        
        // Verificar acceso
        const hasAccess = userAccess[module.id];
        
        if (hasAccess) {
            accessibleModules.push(module);
        }
    });
    
    if (accessibleModules.length === 0) {
        container.innerHTML = '<div class="nav-item"><span>Sin módulos disponibles</span></div>';
        return;
    }
    
    // Generar elementos de navegación
    container.innerHTML = '';
    accessibleModules.forEach(module => {
        const navItem = document.createElement('a');
        navItem.className = 'nav-item';
        navItem.href = module.link || '#';
        
        navItem.innerHTML = `
            <i class="fas ${module.icon || 'fa-cube'}"></i>
            <span>${module.title || 'Módulo sin nombre'}</span>
        `;
        
        container.appendChild(navItem);
    });
}

// =============================================
// CÓDIGO ESPECÍFICO PARA LA PÁGINA DE VER USUARIOS
// =============================================

// Función para desencriptar contraseña
function decryptPassword(encryptedPassword) {
    try {
        return atob(encryptedPassword); // Desencriptación básica desde Base64
    } catch (error) {
        console.error('Error desencriptando contraseña:', error);
        return 'Error al desencriptar';
    }
}

// Función para formatear fecha
function formatTimestamp(timestamp) {
    if (!timestamp) return 'No disponible';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-CL') + ' ' + date.toLocaleTimeString('es-CL');
}

// Función para mostrar usuarios en la tabla
function displayUsers(users) {
    if (users.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center;">No se encontraron usuarios</td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const decryptedPassword = decryptPassword(user.password);
        html += `
            <tr>
                <td>${user.username}</td>
                <td>${user.name || 'No especificado'}</td>
                <td><span class="role-badge ${getBadgeClass(user.role)}">${user.role}</span></td>
                <td>
                    <span class="password-field" onclick="togglePassword(this, '${decryptedPassword}')" 
                          title="Haz clic para mostrar/ocultar">
                        ••••••••
                    </span>
                </td>
                <td>${formatTimestamp(user.createdAt)}</td>
                <td class="actions-column">
                    <button class="btn-action btn-delete" onclick="confirmDeleteUser('${user.username}', '${user.name || user.username}')" 
                            title="Eliminar usuario">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    usersTableBody.innerHTML = html;
}

// Función para alternar visibilidad de contraseña
function togglePassword(element, realPassword) {
    if (element.textContent === '••••••••') {
        element.textContent = realPassword;
        element.classList.add('revealed');
        // Ocultar después de 5 segundos
        setTimeout(() => {
            if (element.textContent === realPassword) {
                element.textContent = '••••••••';
                element.classList.remove('revealed');
            }
        }, 5000);
    } else {
        element.textContent = '••••••••';
        element.classList.remove('revealed');
    }
}

// Función para filtrar usuarios
function filterUsers(users, searchTerm) {
    if (!searchTerm) return users;
    
    searchTerm = searchTerm.toLowerCase();
    return users.filter(user => 
        (user.username && user.username.toLowerCase().includes(searchTerm)) ||
        (user.name && user.name.toLowerCase().includes(searchTerm)) ||
        (user.role && user.role.toLowerCase().includes(searchTerm))
    );
}

// Cargar usuarios desde Firebase
function loadUsers() {
    usersRef.on('value', (snapshot) => {
        const usersData = snapshot.val();
        currentUsers = [];
        
        if (usersData) {
            for (const username in usersData) {
                if (usersData.hasOwnProperty(username)) {
                    currentUsers.push({
                        username: username,
                        ...usersData[username]
                    });
                }
            }
        }
        
        // Mostrar usuarios
        displayUsers(currentUsers);
        
        // Configurar búsqueda
        searchInput.addEventListener('input', () => {
            const filteredUsers = filterUsers(currentUsers, searchInput.value);
            displayUsers(filteredUsers);
        });
    }, (error) => {
        console.error('Error al cargar usuarios:', error);
        showMessage('Error al cargar usuarios: ' + error.message, 'error');
    });
}

// Mostrar mensaje
function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Confirmar eliminación de usuario
let userToDelete = null;

function confirmDeleteUser(username, displayName) {
    userToDelete = username;
    const modalMessage = modal.querySelector('#modalMessage');
    modalMessage.textContent = `¿Estás seguro de que deseas eliminar al usuario "${displayName}" (${username})? Esta acción no se puede deshacer.`;
    modal.style.display = 'flex';
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    modal.style.display = 'none';
    userToDelete = null;
}

// Ejecutar eliminación de usuario
function executeUserDeletion() {
    if (!userToDelete) return;
    
    // Eliminar usuario de Firebase
    usersRef.child(userToDelete).remove()
        .then(() => {
            // También eliminar de usuarios activos si existe
            activeUsersRef.child(userToDelete).remove()
                .then(() => {
                    showMessage(`Usuario "${userToDelete}" eliminado correctamente`, 'success');
                    closeDeleteModal();
                })
                .catch(error => {
                    console.error('Error eliminando de usuarios activos:', error);
                    showMessage(`Usuario "${userToDelete}" eliminado, pero hubo un error al limpiar sesión activa`, 'error');
                    closeDeleteModal();
                });
        })
        .catch(error => {
            console.error('Error eliminando usuario:', error);
            showMessage('Error al eliminar usuario: ' + error.message, 'error');
            closeDeleteModal();
        });
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
        window.location.href = '/index.html';
    }
}