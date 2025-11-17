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
        
        // Elementos del DOM
        const menuToggle = document.getElementById('menuToggle');
        const closeMenu = document.getElementById('closeMenu');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');
        const mainContent = document.getElementById('mainContent');
        
        // Funciones para el menú hamburguesa
        function openMenu() {
            sidebar.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeSidebar() {
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        
        // Función para navegar a páginas
        function navigateTo(page) {
            window.location.href = page;
        }
        
        // Event listeners para el menú
        menuToggle.addEventListener('click', openMenu);
        closeMenu.addEventListener('click', closeSidebar);
        overlay.addEventListener('click', closeSidebar);
        
        // Verificar sesión al cargar
        document.addEventListener('DOMContentLoaded', function() {
            const userData = JSON.parse(sessionStorage.getItem('currentUser'));
            
            if (!userData || !userData.username) {
                window.location.href = '/index.html';
                return;
            }
            
            // Guardar el rol del usuario
            userRole = userData.role;
            
            // Configurar eventos
            document.getElementById('logoutBtn').addEventListener('click', logout);
            
            // Verificar si el usuario sigue activo en uactivos
            activeUsersRef.child(userData.username).once('value')
                .then(snapshot => {
                    if (!snapshot.exists()) {
                        logout();
                        return;
                    }
                    
                    // Mostrar información del usuario
                    displayUserInfo(userData);
                    
                    // Cargar módulos para el menú
                    loadModulesForMenu();
                })
                .catch(error => {
                    console.error('Error verificando sesión activa:', error);
                });
        });
        
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
                    
                    // Verificar si modulesData es un array o un objeto
                    if (Array.isArray(modulesData)) {
                        systemModules = modulesData;
                    } else if (typeof modulesData === 'object' && modulesData !== null) {
                        // Convertir objeto a array
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
        
        // Mostrar información del usuario
        function displayUserInfo(userData) {
            document.getElementById('user-name').textContent = userData.name || userData.username;
            document.getElementById('user-unit').textContent = userData.unit || 'Unidad de Producción 1';
            
            const roleBadge = document.getElementById('user-role');
            roleBadge.textContent = userData.role;
            roleBadge.className = 'role-badge ' + getBadgeClass(userData.role);
        }
        
        // Obtener clase CSS para el badge según el rol (actualizada)
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