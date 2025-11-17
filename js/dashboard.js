// dashboard.js - Lógica específica del dashboard

// Configuración de Firebase
const firebaseConfig = {
    databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const activeUsersRef = database.ref('uactivos');
const modulesRef = database.ref('modules');
const accessRef = database.ref('accesos');

// Mapeo de IDs en español a inglés (para compatibilidad)
const moduleIdMap = {
    // Módulos en español -> inglés
    'usuarios': 'users',
    'asistencias': 'attendance',
    'personal': 'staff',
    'registros': 'records',
    'cosechas': 'harvest',
    'documentos': 'documents',
    'beneficios': 'beneficios',
    'actividades': 'activities',
    'quimicos': 'chemicals',
    'basedatos': 'database',
    'aplicaciones': 'applications',
    'ver-aplicaciones': 'view-apps',
    'registrar-asistencia': 'register-att',
    'registrar-actividades': 'register-act',
    'camaron': 'shrimp',
    'proyecciones': 'projections',
    'consultas': 'queries',
    'plagas': 'pests',
    'riego': 'irrigation',
    'humedad': 'humidity',
    'reportes-publicos': 'public-reports',
    
    // Módulos en inglés (para referencia)
    'users': 'users',
    'attendance': 'attendance',
    'staff': 'staff',
    'records': 'records',
    'harvest': 'harvest',
    'documents': 'documents',
    'beneficios': 'beneficios',
    'activities': 'activities',
    'chemicals': 'chemicals',
    'database': 'database',
    'applications': 'applications',
    'view-apps': 'view-apps',
    'register-att': 'register-att',
    'register-act': 'register-act',
    'shrimp': 'shrimp',
    'projections': 'projections',
    'queries': 'queries',
    'pests': 'pests',
    'irrigation': 'irrigation',
    'humidity': 'humidity',
    'public-reports': 'public-reports'
};

// Variables globales
let systemModules = [];
let roleAccess = {};
let userRole = '';

// Sistema de temas
const themes = ['light', 'dark', 'blue', 'orange', 'purple'];
let currentThemeIndex = 0;

// Cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('agroalpha-theme');
    if (savedTheme) {
        currentThemeIndex = themes.indexOf(savedTheme);
        if (currentThemeIndex === -1) currentThemeIndex = 0;
        document.body.setAttribute('data-theme', themes[currentThemeIndex]);
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
            // Fallback: actualizar directamente si loadUserData falla
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
            // Fallback: actualizar directamente si loadUserData falla
            if (sidebarComponent.updateUserInfo) {
                sidebarComponent.updateUserInfo(userData);
            }
        }
    }
}

// Verificar sesión al cargar
document.addEventListener('DOMContentLoaded', async function() {
    const userData = JSON.parse(sessionStorage.getItem('currentUser'));
    
    if (!userData || !userData.username) {
        window.location.href = 'index.html';
        return;
    }
    
    // Guardar el rol del usuario
    userRole = userData.role;
    
    // Cargar tema guardado
    loadSavedTheme();
    
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
            
            // Cargar datos de Firebase para los módulos
            loadFirebaseData();
        })
        .catch(error => {
            console.error('Error verificando sesión activa:', error);
            showError('Error de conexión. Intente recargar la página.');
            
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
            
            // Verificar si modulesData es un array o un objeto
            if (Array.isArray(modulesData)) {
                systemModules = modulesData;
            } else if (typeof modulesData === 'object' && modulesData !== null) {
                // Convertir objeto a array
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
        
        // Generar las tarjetas con los permisos del usuario
        generateFeatureCards();
    })
    .catch(error => {
        console.error('Error cargando datos de Firebase:', error);
        showError('Error al cargar los módulos. Intente recargar la página.');
    });
}

// Obtener clase CSS para el badge según el rol
function getBadgeClass(role) {
    const roleClasses = {
        'Administrador': 'admin-badge',
        'Supervisor': 'supervisor-badge',
        'Grower': 'grower-badge',
        'Grower Junior': 'grower-badge',
        'Digitador': 'digitador-badge',
        'Técnico Fitosanidad': 'fitosanidad-badge',
        'Técnico Prácticas Culturales': 'culturales-badge',
        'Técnico Riego': 'riego-badge',
        'Invitado': 'invitado-badge',
        'Gerente de Producción': 'gerente-badge',
        'Gerente General': 'gerente-badge',
        'Camaron': 'camaron-badge',
        'Jefe de Vivero': 'jefe-vivero-badge',
        'Mezclero Fitosanidad': 'mezclero-fitosanidad-badge',
        'Usuario1': 'usuario1-badge',
        'Usuario2': 'usuario2-badge',
        'Usuario3': 'usuario3-badge',
        'Usuario4': 'usuario4-badge'
    };
    return roleClasses[role] || 'invitado-badge';
}

// Normalizar ID del módulo (para manejar español/inglés)
function normalizeModuleId(moduleId) {
    if (!moduleId) return null;
    
    // Si el ID ya está en inglés, devolverlo tal cual
    if (moduleIdMap[moduleId]) {
        return moduleIdMap[moduleId];
    }
    
    // Si no está en el mapa, intentar encontrar coincidencia
    const normalizedId = moduleId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return moduleIdMap[normalizedId] || moduleId;
}

// Generar tarjetas de características según los permisos del rol
function generateFeatureCards() {
    const container = document.getElementById('featuresContainer');
    
    // Verificar si tenemos los datos necesarios
    if (systemModules.length === 0) {
        container.innerHTML = '<div class="error-message">No hay módulos configurados en el sistema.</div>';
        return;
    }
    
    if (Object.keys(roleAccess).length === 0) {
        container.innerHTML = '<div class="error-message">No hay permisos configurados en el sistema.</div>';
        return;
    }
    
    // Obtener los accesos para el rol del usuario
    const userAccess = roleAccess[userRole];
    
    if (!userAccess) {
        container.innerHTML = `<div class="error-message">No se encontraron permisos para el rol "${userRole}".</div>`;
        return;
    }
    
    // Filtrar módulos a los que el usuario tiene acceso
    const accessibleModules = [];
    
    systemModules.forEach(module => {
        if (!module || !module.id) return;
        
        // Normalizar ID del módulo para compatibilidad
        const normalizedId = normalizeModuleId(module.id);
        const hasAccess = userAccess[normalizedId] || userAccess[module.id];
        
        if (hasAccess) {
            accessibleModules.push(module);
        }
    });
    
    if (accessibleModules.length === 0) {
        container.innerHTML = '<div class="error-message">No tiene acceso a ningún módulo. Contacte al administrador.</div>';
        return;
    }
    
    // Generar tarjetas para los módulos accesibles
    container.innerHTML = '';
    accessibleModules.forEach(module => {
        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = function() {
            window.location.href = module.link || '#';
        };
        
        card.innerHTML = `
            <div class="card-icon"><i class="fas ${module.icon || 'fa-cube'}"></i></div>
            <h3>${module.title || 'Módulo sin nombre'}</h3>
        `;
        
        container.appendChild(card);
    });
}

// Mostrar mensaje de error
function showError(message) {
    const container = document.getElementById('featuresContainer');
    container.innerHTML = `<div class="error-message">${message}</div>`;
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