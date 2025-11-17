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

// Elementos del DOM
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const fullnameInput = document.getElementById('fullname');
const roleSelect = document.getElementById('role');
const createButton = document.getElementById('createButton');
const buttonText = document.getElementById('buttonText');
const messageDiv = document.getElementById('message');

// Sistema de temas
const themes = ['light', 'dark', 'blue', 'orange', 'purple'];

// Cargar tema guardado
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('agroalpha-theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
    }
}

// Función para mostrar mensajes
function showMessage(text, type) {
    messageDiv.innerHTML = text;
    messageDiv.className = 'message ' + type;
    messageDiv.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// Función para limpiar el formulario
function resetForm() {
    usernameInput.value = '';
    passwordInput.value = '';
    fullnameInput.value = '';
    roleSelect.value = '';
    usernameInput.focus();
}

// Función para encriptar contraseña (básica)
function encryptPassword(password) {
    return btoa(password); // Encriptación básica en Base64
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

// Función principal para crear usuario
async function createUser() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const fullname = fullnameInput.value.trim();
    const role = roleSelect.value;
    
    // Validaciones básicas
    if (!username || !password || !fullname || !role) {
        showMessage('Por favor complete todos los campos', 'error');
        return;
    }
    
    if (password.length < 6) {
        showMessage('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Mostrar estado de carga
    createButton.disabled = true;
    buttonText.innerHTML = '<span class="loading"></span> Creando usuario...';
    messageDiv.style.display = 'none';
    
    try {
        // Verificar si el usuario ya existe
        const snapshot = await usersRef.child(username).once('value');
        
        if (snapshot.exists()) {
            showMessage('El nombre de usuario ya existe', 'error');
            createButton.disabled = false;
            buttonText.textContent = 'Crear Usuario';
            return;
        }
        
        // Crear el objeto de usuario
        const userData = {
            password: encryptPassword(password),
            name: fullname,
            role: role,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        
        // Guardar en la base de datos
        await usersRef.child(username).set(userData);
        
        // Mostrar mensaje de éxito
        showMessage(
            `Usuario <strong>${username}</strong> creado exitosamente como <span class="role-badge ${getBadgeClass(role)}">${role}</span>`, 
            'success'
        );
        
        // Reiniciar formulario
        resetForm();
        
    } catch (error) {
        console.error('Error al crear usuario:', error);
        showMessage('Error al crear usuario: ' + error.message, 'error');
    } finally {
        createButton.disabled = false;
        buttonText.textContent = 'Crear Usuario';
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
        })
        .catch(error => {
            console.error('Error verificando sesión activa:', error);
            
            // Intentar cargar datos del usuario aunque falle la verificación
            loadUserDataInComponents(userData);
        });
});

// Event Listeners
createButton.addEventListener('click', createUser);

// Permitir enviar con Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        createUser();
    }
});

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