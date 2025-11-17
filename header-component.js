class HeaderComponent extends HTMLElement {
  constructor() {
    super();
    this.userData = null;
    this.isFirebaseInitialized = false;
    this.initialized = false;
    this.firebaseConfig = {
      databaseURL: "https://agro-productos-default-rtdb.firebaseio.com/"
    };
    this.sessionCheckAttempts = 0;
    this.maxSessionCheckAttempts = 5;
  }

  connectedCallback() {
    this.render();
    this.initializeFirebase();
    // Esperar un poco antes de inicializar el header para dar tiempo a la carga
    setTimeout(() => {
      this.initializeHeader();
    }, 500);
  }

  render() {
    this.innerHTML = `
      <!-- Header mejorado y responsive -->
      <div class="header">
        <div class="header-content">
          <div class="header-left">
            <!-- Botón del menú -->
            <div class="header-actions">
              <div class="btn-container">
                <button class="header-btn" id="menuToggle" title="Menú">
                  <i class="fas fa-bars"></i>
                </button>
              </div>
            </div>
            
            <!-- Marca -->
            <div class="brand">
              <div class="brand-icon">
                <i class="fas fa-seedling"></i>
              </div>
              <div class="brand-text">
                <h1>Agroalpha</h1>
                <span>Unidad de producción 1</span>
              </div>
            </div>
          </div>
          
          <div class="header-right">
            <!-- Información del usuario en desktop -->
            <div class="user-info">
              <div class="user-details">
                <span class="user-name" id="user-name">Cargando...</span>
                <span id="user-role" class="role-badge">Cargando...</span>
              </div>
            </div>
            
            <!-- Botones de acción -->
            <div class="header-actions">
              <div class="btn-container">
                <button class="header-btn" id="notificationsBtn" title="Notificaciones">
                  <i class="fas fa-bell"></i>
                  <span class="notification-badge">3</span>
                </button>
              </div>
              <!-- Botón de temas oculto según components.css -->
              <div class="theme-btn-container" style="display: none !important">
                <button class="header-btn" id="themeToggle" title="Cambiar tema">
                  <i class="fas fa-palette"></i>
                </button>
              </div>
            </div>
            
            <!-- Menú de usuario móvil -->
            <div class="mobile-user-menu">
              <div class="user-avatar" id="userAvatar">
                ...
              </div>
              <div class="user-dropdown" id="userDropdown">
                <div class="dropdown-item">
                  <i class="fas fa-user"></i>
                  <span id="dropdown-user-name">Cargando...</span>
                </div>
                <div class="dropdown-item">
                  <i class="fas fa-briefcase"></i>
                  <span id="dropdown-user-role">Cargando...</span>
                </div>
                <div class="dropdown-divider"></div>
                <a class="dropdown-item" href="/perfil.html">
                  <i class="fas fa-cog"></i>
                  <span>Mi Perfil</span>
                </a>
                <a class="dropdown-item" href="/configuracion.html">
                  <i class="fas fa-palette"></i>
                  <span>Configuración</span>
                </a>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item" id="mobileLogoutBtn">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Cerrar Sesión</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initializeFirebase() {
    try {
      // Verificar si Firebase ya está inicializado
      if (typeof firebase !== 'undefined' && firebase.apps.length === 0) {
        firebase.initializeApp(this.firebaseConfig);
        console.log('Firebase inicializado por HeaderComponent');
      } else if (typeof firebase !== 'undefined') {
        console.log('Firebase ya estaba inicializado');
      }
      this.isFirebaseInitialized = true;
    } catch (error) {
      console.error('Error inicializando Firebase:', error);
      // No bloquear la aplicación si Firebase falla
      console.log('Continuando sin Firebase...');
    }
  }

  async initializeHeader() {
    if (this.initialized) return;
    
    console.log('Inicializando header component...');
    
    // Configurar event listeners primero
    this.setupEventListeners();
    
    // Luego verificar sesión de forma no bloqueante
    this.verifySession();
    
    // Escuchar eventos de cambio de usuario
    this.setupUserChangeListener();
    
    // Escuchar cambios de tema
    this.setupThemeListener();
    
    this.initialized = true;
  }

  async verifySession() {
    try {
      const userData = JSON.parse(sessionStorage.getItem('currentUser'));
      
      if (!userData || !userData.username) {
        this.sessionCheckAttempts++;
        
        if (this.sessionCheckAttempts >= this.maxSessionCheckAttempts) {
          console.log('Máximos intentos alcanzados, redirigiendo al login...');
          this.redirectToLogin();
          return;
        }
        
        console.log(`No hay usuario en sesión (intento ${this.sessionCheckAttempts}/${this.maxSessionCheckAttempts}), reintentando...`);
        
        // Reintentar después de un tiempo
        setTimeout(() => {
          this.verifySession();
        }, 1000);
        return;
      }
      
      // Si llegamos aquí, tenemos datos de usuario
      console.log('Usuario encontrado en sesión:', userData.username);
      this.sessionCheckAttempts = 0; // Resetear contador
      
      // Guardar el rol del usuario
      this.userRole = userData.role;
      
      // Verificar si el usuario sigue activo en uactivos (solo si Firebase está disponible)
      if (this.isFirebaseInitialized) {
        try {
          const database = firebase.database();
          const activeUsersRef = database.ref('uactivos');
          
          const snapshot = await activeUsersRef.child(userData.username).once('value');
          if (!snapshot.exists()) {
            console.log('Usuario no activo en Firebase, cerrando sesión...');
            this.showSessionExpiredMessage();
            return;
          }
        } catch (firebaseError) {
          console.warn('Error verificando usuario activo en Firebase, continuando...', firebaseError);
          // Continuar incluso si hay error en Firebase
        }
      }
      
      // Mostrar información del usuario
      this.updateUserInfo(userData);
      
    } catch (error) {
      console.error('Error verificando sesión:', error);
      // No redirigir inmediatamente en caso de error
      this.showDefaultUserInfo();
    }
  }

  setupEventListeners() {
    const menuToggle = this.querySelector('#menuToggle');
    const userAvatar = this.querySelector('#userAvatar');
    const userDropdown = this.querySelector('#userDropdown');
    const mobileLogoutBtn = this.querySelector('#mobileLogoutBtn');
    const notificationsBtn = this.querySelector('#notificationsBtn');

    // Abrir sidebar
    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        const event = new CustomEvent('openSidebar', { 
          bubbles: true,
          detail: { userData: this.userData }
        });
        this.dispatchEvent(event);
      });
    }

    // Toggle dropdown de usuario
    if (userAvatar) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });
    }

    // Notificaciones
    if (notificationsBtn) {
      notificationsBtn.addEventListener('click', () => {
        const event = new CustomEvent('showNotifications', { 
          bubbles: true,
          detail: { userData: this.userData }
        });
        this.dispatchEvent(event);
      });
    }

    // Cerrar dropdown al hacer clic fuera
    document.addEventListener('click', () => {
      if (userDropdown) {
        userDropdown.classList.remove('active');
      }
    });

    // Logout desde móvil
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  }

  setupUserChangeListener() {
    // Escuchar cambios en sessionStorage
    window.addEventListener('storage', (e) => {
      if (e.key === 'currentUser') {
        this.loadUserDataFromSession();
      }
    });

    // Escuchar eventos personalizados de actualización de usuario
    document.addEventListener('userDataUpdated', (e) => {
      console.log('Evento userDataUpdated recibido:', e.detail);
      if (e.detail && e.detail.userData) {
        this.userData = e.detail.userData;
        this.updateUserInfo(e.detail.userData);
      }
    });

    // También escuchar cuando la página termina de cargar
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
          this.loadUserDataFromSession();
        }, 500);
      });
    } else {
      setTimeout(() => {
        this.loadUserDataFromSession();
      }, 500);
    }
  }

  setupThemeListener() {
    // Observar cambios en el atributo data-theme del body
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          this.handleThemeChange();
        }
      });
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    // Manejar tema inicial
    this.handleThemeChange();
  }

  handleThemeChange() {
    const currentTheme = document.body.getAttribute('data-theme') || 'light';
    console.log('Tema actual detectado:', currentTheme);
    
    // Actualizar estilos específicos del tema si es necesario
    const header = this.querySelector('.header');
    if (header) {
      // El CSS de components.css ya maneja los temas, solo necesitamos asegurar que se aplique
      header.style.setProperty('--current-theme', currentTheme);
    }
  }

  async loadUserDataFromSession() {
    try {
      console.log('Cargando datos de sessionStorage...');
      const userDataString = sessionStorage.getItem('currentUser');
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('Datos encontrados en sessionStorage:', userData);
        
        this.userData = userData;
        // Actualizar con datos de sessionStorage inmediatamente
        this.updateUserInfo(userData);
        
        return userData;
      } else {
        console.log('No hay datos de usuario en sessionStorage');
        this.showDefaultUserInfo();
        return null;
      }
    } catch (error) {
      console.error('Error cargando datos de sessionStorage:', error);
      this.showDefaultUserInfo();
      return null;
    }
  }

  updateUserInfo(userData) {
    if (!userData) {
      this.showDefaultUserInfo();
      return;
    }

    const userName = userData.nombre || userData.name || userData.username || 'Usuario';
    const userRole = userData.rol || userData.role || 'Rol no asignado';

    console.log('Actualizando header con:', { userName, userRole });

    // Actualizar elementos del header
    const userNameElement = this.querySelector('#user-name');
    const userRoleElement = this.querySelector('#user-role');
    const dropdownUserName = this.querySelector('#dropdown-user-name');
    const dropdownUserRole = this.querySelector('#dropdown-user-role');
    const userAvatar = this.querySelector('#userAvatar');

    if (userNameElement) userNameElement.textContent = userName;
    if (userRoleElement) {
      userRoleElement.textContent = userRole;
      userRoleElement.className = 'role-badge ' + this.getBadgeClass(userRole);
    }
    if (dropdownUserName) dropdownUserName.textContent = userName;
    if (dropdownUserRole) dropdownUserRole.textContent = userRole;
    
    // Actualizar avatar
    if (userAvatar) {
      userAvatar.textContent = this.getUserInitials(userName);
      userAvatar.setAttribute('title', userName);
    }

    // Disparar evento de que el header se actualizó
    const event = new CustomEvent('headerUpdated', {
      detail: { userData }
    });
    this.dispatchEvent(event);
  }

  showDefaultUserInfo() {
    console.log('Mostrando información de usuario por defecto');
    
    const userNameElement = this.querySelector('#user-name');
    const userRoleElement = this.querySelector('#user-role');
    const dropdownUserName = this.querySelector('#dropdown-user-name');
    const dropdownUserRole = this.querySelector('#dropdown-user-role');
    const userAvatar = this.querySelector('#userAvatar');

    if (userNameElement) userNameElement.textContent = 'Invitado';
    if (userRoleElement) {
      userRoleElement.textContent = 'No identificado';
      userRoleElement.className = 'role-badge invitado-badge';
    }
    if (dropdownUserName) dropdownUserName.textContent = 'Invitado';
    if (dropdownUserRole) dropdownUserRole.textContent = 'No identificado';
    if (userAvatar) userAvatar.textContent = 'IN';
  }

  showSessionExpiredMessage() {
    // Mostrar mensaje en lugar de redirigir inmediatamente
    const userNameElement = this.querySelector('#user-name');
    const userRoleElement = this.querySelector('#user-role');
    
    if (userNameElement) userNameElement.textContent = 'Sesión Expirada';
    if (userRoleElement) {
      userRoleElement.textContent = 'Reiniciar Sesión';
      userRoleElement.className = 'role-badge invitado-badge';
      userRoleElement.style.cursor = 'pointer';
      userRoleElement.onclick = () => this.redirectToLogin();
    }
    
    // Mostrar toast o alerta
    this.showToast('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'warning');
    
    // Redirigir después de 5 segundos
    setTimeout(() => {
      this.redirectToLogin();
    }, 5000);
  }

  showToast(message, type = 'info') {
    // Crear un toast simple que respete los temas
    const toast = document.createElement('div');
    const backgroundColor = type === 'warning' ? 'var(--gerente-color)' : 'var(--primary-color)';
    
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      background: ${backgroundColor};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: var(--hover-shadow);
      font-weight: 500;
      max-width: 300px;
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 5000);
  }

  redirectToLogin() {
    console.log('Redirigiendo al login...');
    sessionStorage.removeItem('currentUser');
    window.location.href = '/index.html';
  }

  getUserInitials(name) {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 2);
  }

  getBadgeClass(role) {
    const roleClasses = {
      'Administrador': 'admin-badge',
      'Admin': 'admin-badge',
      'Gerente General': 'gerente-badge',
      'Gerente de Producción': 'gerente-badge',
      'Supervisor': 'supervisor-badge',
      'Jefe de Vivero': 'jefe-vivero-badge',
      'Grower': 'grower-badge',
      'Grower Junior': 'grower-badge',
      'Digitador': 'digitador-badge',
      'Técnico Fitosanidad': 'fitosanidad-badge',
      'Fitosanidad': 'fitosanidad-badge',
      'Técnico Prácticas Culturales': 'culturales-badge',
      'Prácticas Culturales': 'culturales-badge',
      'Culturales': 'culturales-badge',
      'Técnico Riego': 'riego-badge',
      'Riego': 'riego-badge',
      'Mezclero Fitosanidad': 'mezclero-fitosanidad-badge',
      'Consultor': 'invitado-badge',
      'Usuario1': 'usuario1-badge',
      'Usuario2': 'usuario2-badge',
      'Usuario3': 'usuario3-badge',
      'Usuario4': 'usuario4-badge',
      'Invitado': 'invitado-badge'
    };
    return roleClasses[role] || 'invitado-badge';
  }

  // Método público para forzar actualización
  refreshUserData() {
    console.log('Refrescando datos de usuario...');
    this.loadUserDataFromSession();
  }

  // Cerrar sesión
  async logout() {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      try {
        const userData = JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (userData?.username && this.isFirebaseInitialized) {
          const database = firebase.database();
          const activeUsersRef = database.ref('uactivos');
          
          // Eliminar de usuarios activos
          await activeUsersRef.child(userData.username).remove();
          console.log('Usuario eliminado de uactivos');
        }
        
        // Limpiar sessionStorage y redirigir
        this.redirectToLogin();
        
      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // En caso de error, igualmente limpiar y redirigir
        this.redirectToLogin();
      }
    }
  }

  // Método para verificar estado de Firebase
  checkFirebaseStatus() {
    return this.isFirebaseInitialized;
  }

  // Método para obtener datos del usuario actual
  getCurrentUser() {
    return this.userData;
  }

  // Método para obtener el rol del usuario actual
  getCurrentUserRole() {
    return this.userRole;
  }
}

customElements.define('header-component', HeaderComponent);