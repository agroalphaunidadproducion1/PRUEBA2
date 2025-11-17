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

// Mapeo de IDs en español a inglés (para compatibilidad)
const moduleIdMap = {
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
    'reportes-publicos': 'public-reports'
};

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

// Función para navegar a páginas
function navigateTo(page) {
    window.location.href = page;
}

// Normalizar ID del módulo (para manejar español/inglés)
function normalizeModuleId(moduleId) {
    if (!moduleId) return null;
    
    if (moduleIdMap[moduleId]) {
        return moduleIdMap[moduleId];
    }
    
    const normalizedId = moduleId.toLowerCase().replace(/[^a-z0-9]/g, '-');
    return moduleIdMap[normalizedId] || moduleId;
}

// Mostrar mensaje de error
function showError(message) {
    console.error(message);
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
    })
    .catch(error => {
        console.error('Error cargando datos de Firebase:', error);
        showError('Error al cargar los módulos. Intente recargar la página.');
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
        window.location.href = 'index.html';
    }
}