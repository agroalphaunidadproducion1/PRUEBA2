class SidebarComponent extends HTMLElement {
  constructor() {
    super();
    this.userData = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <!-- Sidebar -->
      <div class="sidebar" id="sidebar">
        <button class="close-menu" id="closeMenu">
          <i class="fas fa-times"></i>
        </button>
        
        <div class="logo">
          <h1><i class="fas fa-seedling"></i> Agroalpha</h1>
        </div>
        
        <div class="user-info-sidebar">
          <p id="user-unit">Unidad de Producción 1</p>
          <p id="sidebar-user-name">Cargando...</p>
          <p id="sidebar-user-role" class="role-badge">Cargando...</p>
        </div>
        
        <div class="nav-section">
          <h3>Navegación Principal</h3>
          <a class="nav-item" href="/dashboard.html" id="dashboard-link">
            <i class="fas fa-tachometer-alt"></i>
            <span>Dashboard</span>
          </a>
          <a class="nav-item" href="/notificaciones.html">
            <i class="fas fa-bell"></i>
            <span>Notificaciones</span>
          </a>
        </div>
        
        <div class="nav-section">
          <h3>Configuración</h3>
          <div class="nav-item has-submenu" id="configMenu">
            <div>
              <i class="fas fa-cog"></i>
              <span>Configuración</span>
            </div>
            <i class="fas fa-chevron-down"></i>
          </div>
          <div class="submenu" id="configSubmenu">
            <a class="submenu-item" href="/temas.html">
              <i class="fas fa-palette"></i>
              <span>Temas</span>
            </a>
            <a class="submenu-item" href="/notificaciones-config.html">
              <i class="fas fa-bell"></i>
              <span>Notificaciones</span>
            </a>
            <a class="submenu-item" href="/usuarios.html">
              <i class="fas fa-users"></i>
              <span>Gestión de Usuarios</span>
            </a>
            <a class="submenu-item" href="/parametros.html">
              <i class="fas fa-sliders-h"></i>
              <span>Parámetros del Sistema</span>
            </a>
            <a class="submenu-item" href="/backup.html">
              <i class="fas fa-database"></i>
              <span>Backup y Restauración</span>
            </a>
            <a class="submenu-item" href="/logs.html">
              <i class="fas fa-clipboard-list"></i>
              <span>Registros del Sistema</span>
            </a>
          </div>
          
          <a class="nav-item" href="/perfil.html">
            <i class="fas fa-user"></i>
            <span>Mi Perfil</span>
          </a>
        </div>
        
        <div class="nav-section">
          <h3>Soporte</h3>
          <a class="nav-item" href="/ayuda.html">
            <i class="fas fa-question-circle"></i>
            <span>Ayuda</span>
          </a>
          <a class="nav-item" href="/manual.html">
            <i class="fas fa-book"></i>
            <span>Manual de Usuario</span>
          </a>
          <a class="nav-item" href="/soporte.html">
            <i class="fas fa-headset"></i>
            <span>Soporte Técnico</span>
          </a>
          <div class="nav-item" id="logoutBtn">
            <i class="fas fa-sign-out-alt"></i>
            <span>Cerrar Sesión</span>
          </div>
        </div>
      </div>

      <!-- Overlay para cerrar menú -->
      <div class="overlay" id="overlay"></div>
    `;

    this.initializeSidebar();
  }

  initializeSidebar() {
    const sidebar = this.querySelector('#sidebar');
    const closeMenu = this.querySelector('#closeMenu');
    const overlay = this.querySelector('#overlay');
    const configMenu = this.querySelector('#configMenu');
    const configSubmenu = this.querySelector('#configSubmenu');
    const logoutBtn = this.querySelector('#logoutBtn');

    // Cerrar sidebar
    const closeSidebar = () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = 'auto';
    };

    // Abrir sidebar
    const openSidebar = () => {
      sidebar.classList.add('active');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    // Event listeners
    if (closeMenu) closeMenu.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    // Toggle submenu de configuración - CORREGIDO
    if (configMenu && configSubmenu) {
      configMenu.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Toggle el submenu actual
        this.classList.toggle('active');
        configSubmenu.classList.toggle('active');
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
          const event = new CustomEvent('logout', { bubbles: true });
          this.dispatchEvent(event);
        }
      });
    }

    // Escuchar evento para abrir sidebar desde el header
    document.addEventListener('openSidebar', openSidebar);

    // Cerrar sidebar con tecla Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar.classList.contains('active')) {
        closeSidebar();
      }
    });

    // Marcar enlace activo basado en la página actual
    this.setActiveLink();

    // Cargar datos del usuario
    this.loadUserDataFromSession();
  }

  // Método para cargar datos del usuario desde sessionStorage
  loadUserDataFromSession() {
    try {
      const userDataString = sessionStorage.getItem('currentUser');
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        this.userData = userData;
        this.updateUserInfo(userData);
      } else {
        this.showDefaultUserInfo();
      }
    } catch (error) {
      console.error('Error cargando datos del usuario en sidebar:', error);
      this.showDefaultUserInfo();
    }
  }

  // Método para actualizar información del usuario en sidebar
  updateUserInfo(userData) {
    if (!userData) {
      this.showDefaultUserInfo();
      return;
    }

    const userName = userData.nombre || userData.name || userData.username || 'Usuario';
    const userRole = userData.rol || userData.role || 'Rol no asignado';
    const userUnit = userData.unidad || userData.unit || 'Unidad de Producción 1';

    const sidebarUserName = this.querySelector('#sidebar-user-name');
    const sidebarUserRole = this.querySelector('#sidebar-user-role');
    const userUnitElement = this.querySelector('#user-unit');

    if (sidebarUserName) sidebarUserName.textContent = userName;
    if (sidebarUserRole) {
      sidebarUserRole.textContent = userRole;
      sidebarUserRole.className = 'role-badge ' + this.getBadgeClass(userRole);
    }
    if (userUnitElement) userUnitElement.textContent = userUnit;
  }

  showDefaultUserInfo() {
    const sidebarUserName = this.querySelector('#sidebar-user-name');
    const sidebarUserRole = this.querySelector('#sidebar-user-role');
    const userUnitElement = this.querySelector('#user-unit');

    if (sidebarUserName) sidebarUserName.textContent = 'Invitado';
    if (sidebarUserRole) {
      sidebarUserRole.textContent = 'No identificado';
      sidebarUserRole.className = 'role-badge invitado-badge';
    }
    if (userUnitElement) userUnitElement.textContent = 'Unidad de Producción 1';
  }

  // Marcar enlace activo
  setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const navItems = this.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.classList.remove('active');
      const href = item.getAttribute('href');
      if (href && currentPage.includes(href.replace('/', '').replace('.html', ''))) {
        item.classList.add('active');
      }
    });
  }

  getBadgeClass(role) {
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
}

customElements.define('sidebar-component', SidebarComponent);