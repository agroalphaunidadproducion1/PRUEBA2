// Sistema de Navegación Global - Agroalpha
class GlobalMenu {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.setupMenuToggle();
        this.setupActivePage();
        this.setupUserInfo();
        this.setupFirebaseListeners();
        this.handleResize();
        this.setupLogout();
    }

    setupMenuToggle() {
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const mainContent = document.getElementById('mainContent');

        if (hamburgerMenu && sidebar) {
            const toggleSidebar = () => {
                sidebar.classList.toggle('active');
                sidebarOverlay.classList.toggle('active');
                if (mainContent) {
                    mainContent.classList.toggle('sidebar-open');
                }
            };

            hamburgerMenu.addEventListener('click', toggleSidebar);
            if (sidebarOverlay) {
                sidebarOverlay.addEventListener('click', toggleSidebar);
            }
        }
    }

    setupActivePage() {
        // Obtener la página actual del atributo data-page del body
        const currentPage = document.body.getAttribute('data-page');
        
        if (currentPage) {
            // Remover active de todos los items
            document.querySelectorAll('.menu-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Activar el item correspondiente
            const activeItem = document.querySelector(`[data-page="${currentPage}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        }

        // Cerrar sidebar al hacer clic en items (mobile)
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth < 1200) {
                    this.closeSidebar();
                }
            });
        });
    }

    setupUserInfo() {
        // Cargar información del usuario desde sessionStorage
        try {
            const userData = JSON.parse(sessionStorage.getItem('currentUser'));
            if (userData) {
                this.currentUser = userData;
                this.updateUserInterface(userData);
            }
        } catch (error) {
            console.log('No hay información de usuario disponible');
        }
    }

    updateUserInterface(userData) {
        const userNameElement = document.getElementById('currentUserName');
        const userRoleElement = document.getElementById('currentUserRole');
        const userAvatarElement = document.getElementById('userAvatar');
        const welcomeNameElement = document.getElementById('welcome-name');

        if (userNameElement) {
            userNameElement.textContent = userData.name || userData.username;
        }
        
        if (userRoleElement) {
            userRoleElement.textContent = userData.role || 'Usuario';
        }
        
        if (welcomeNameElement) {
            welcomeNameElement.textContent = userData.name || userData.username;
        }

        if (userAvatarElement && userData.name) {
            const initials = userData.name.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase();
            userAvatarElement.textContent = initials.substring(0, 2);
            userAvatarElement.innerHTML = ''; // Limpiar contenido previo
            userAvatarElement.textContent = initials.substring(0, 2);
        }
    }

    setupFirebaseListeners() {
        // Configuración de Firebase
        const firebaseConfig = {
            databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
        };

        // Inicializar Firebase si no está inicializado
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        // Escuchar cambios en usuarios activos
        const activeUsersRef = firebase.database().ref('uactivos');
        if (this.currentUser && this.currentUser.username) {
            activeUsersRef.child(this.currentUser.username).on('value', (snapshot) => {
                if (!snapshot.exists()) {
                    this.logout();
                }
            });
        }

        // Cargar módulos para el menú
        this.loadModulesForMenu();
    }

    async loadModulesForMenu() {
        try {
            const database = firebase.database();
            const [modulesSnapshot, accessSnapshot] = await Promise.all([
                database.ref('modules').once('value'),
                database.ref('accesos').once('value')
            ]);

            const modulesData = modulesSnapshot.val();
            const accessData = accessSnapshot.val();

            if (modulesData && accessData && this.currentUser) {
                this.generateModulesMenu(modulesData, accessData);
            }
        } catch (error) {
            console.error('Error cargando módulos para el menú:', error);
            this.showModulesError();
        }
    }

    generateModulesMenu(modulesData, accessData) {
        const container = document.getElementById('modulesMenuContainer');
        if (!container) return;

        const userRole = this.currentUser.role;
        const userAccess = accessData[userRole];

        if (!userAccess) {
            container.innerHTML = '<div class="menu-item"><span>Sin permisos para módulos</span></div>';
            return;
        }

        // Convertir módulos a array si es objeto
        const modulesArray = Array.isArray(modulesData) ? 
            modulesData : Object.values(modulesData || {});

        let html = '';
        let accessibleCount = 0;

        // Mapeo de IDs de módulos
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

        modulesArray.forEach(module => {
            if (!module || !module.id) return;

            // Normalizar ID del módulo
            const normalizedId = moduleIdMap[module.id] || module.id;
            const hasAccess = userAccess[normalizedId] || userAccess[module.id];

            if (hasAccess && module.link && module.title) {
                accessibleCount++;
                html += `
                    <a href="${module.link}" class="menu-item" data-page="${module.id}">
                        <i class="fas ${module.icon || 'fa-cube'}"></i>
                        <span>${module.title}</span>
                    </a>
                `;
            }
        });

        if (accessibleCount === 0) {
            html = '<div class="menu-item"><span>No tiene acceso a módulos</span></div>';
        }

        container.innerHTML = html;

        // Re-configurar eventos para los nuevos items del menú
        this.setupActivePage();
    }

    showModulesError() {
        const container = document.getElementById('modulesMenuContainer');
        if (container) {
            container.innerHTML = '<div class="menu-item"><span>Error cargando módulos</span></div>';
        }
    }

    setupLogout() {
        const logoutMenuItem = document.getElementById('logoutMenuItem');
        if (logoutMenuItem) {
            logoutMenuItem.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    logout() {
        if (this.currentUser?.username) {
            const activeUsersRef = firebase.database().ref('uactivos');
            activeUsersRef.child(this.currentUser.username).remove()
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

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        const mainContent = document.getElementById('mainContent');

        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        if (mainContent) mainContent.classList.remove('sidebar-open');
    }

    handleResize() {
        window.addEventListener('resize', () => {
            if (window.innerWidth >= 1200) {
                const sidebar = document.getElementById('sidebar');
                const mainContent = document.getElementById('mainContent');
                
                if (sidebar) sidebar.classList.add('active');
                if (mainContent) mainContent.classList.add('sidebar-open');
            } else {
                this.closeSidebar();
            }
        });

        // Inicializar en carga
        if (window.innerWidth >= 1200) {
            const sidebar = document.getElementById('sidebar');
            const mainContent = document.getElementById('mainContent');
            
            if (sidebar) sidebar.classList.add('active');
            if (mainContent) mainContent.classList.add('sidebar-open');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new GlobalMenu();
});