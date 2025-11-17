// Configuración de Firebase
        const firebaseConfig = {
            databaseURL: "https://agro-productos-default-rtdb.firebaseio.com"
        };

        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        const database = firebase.database();

        // Referencia a la tabla de personal
        const personalRef = database.ref('personal');

        // Datos de invernaderos por módulo (todos incluyen Fitosanidad y Riego)
        const invernaderosPorModulo = {
            'C': ['9', '10', '11', '12', 'Fitosanidad', 'Riego'],
            'D': ['13', '14', '15', '16', 'Fitosanidad', 'Riego'],
            'I': ['33', '35', 'Fitosanidad', 'Riego'],
            'J': ['37', '39', 'Fitosanidad', 'Riego'],
            'otras-areas': ['Mantenimiento', 'Fitosanidad', 'Riego', 'Vivero']
        };

        // Variables para almacenar selecciones
        let moduloSeleccionado = '';
        let invernaderosSeleccionados = [];

        // Inicializar toast de notificación
        const toastLiveExample = document.getElementById('liveToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toastLiveExample);

        // Verificar sesión al cargar
        document.addEventListener('DOMContentLoaded', function() {
            // Verificar si hay usuario en sesión
            const currentUser = sessionStorage.getItem('currentUser');
            if (!currentUser) {
                // Redirigir al login si no hay usuario
                window.location.href = '/index.html';
                return;
            }

            // Esperar a que los componentes estén listos
            setTimeout(() => {
                initializeForm();
                // Marcar página como cargada
                document.body.classList.add('loaded');
            }, 100);
        });

        function initializeForm() {
            // Configurar módulos
            const modulos = document.querySelectorAll('.module-badge');
            modulos.forEach(modulo => {
                modulo.addEventListener('click', function() {
                    // Deseleccionar todos los módulos
                    modulos.forEach(m => m.classList.remove('selected'));
                    
                    // Seleccionar el módulo clickeado
                    this.classList.add('selected');
                    moduloSeleccionado = this.dataset.module;
                    document.getElementById('modulo-seleccionado').value = moduloSeleccionado;
                    
                    // Ocultar mensaje de error si existe
                    document.getElementById('modulo-error').style.display = 'none';
                    
                    // Actualizar vista previa
                    actualizarVistaPrevia();
                    
                    // Cargar invernaderos para el módulo seleccionado
                    cargarInvernaderos(moduloSeleccionado);
                });
            });

            // Configurar formulario
            document.getElementById('employee-form').addEventListener('submit', function(e) {
                e.preventDefault();
                
                if (validarFormulario()) {
                    guardarEmpleado();
                }
            });

            // Configurar cancelar
            document.getElementById('btn-cancelar').addEventListener('click', function() {
                if (confirm('¿Está seguro de que desea cancelar? Se perderán todos los datos ingresados.')) {
                    resetFormulario();
                }
            });

            // Actualizar vista previa en tiempo real
            document.getElementById('nombre').addEventListener('input', actualizarVistaPrevia);
            document.getElementById('codigo').addEventListener('input', actualizarVistaPrevia);
            document.getElementById('puesto').addEventListener('change', actualizarVistaPrevia);
        }

        // Cargar invernaderos según el módulo seleccionado
        function cargarInvernaderos(modulo) {
            const contenedor = document.getElementById('contenedor-invernaderos');
            const invernaderos = invernaderosPorModulo[modulo] || [];
            
            contenedor.innerHTML = '';
            invernaderosSeleccionados = [];
            
            if (invernaderos.length === 0) {
                contenedor.innerHTML = '<div class="alert alert-warning">No hay opciones disponibles para este módulo</div>';
                return;
            }
            
            // Actualizar texto según el módulo seleccionado
            if (modulo === 'otras-areas') {
                document.getElementById('invernadero-text').textContent = 'Seleccione las áreas:';
            } else {
                document.getElementById('invernadero-text').textContent = 'Seleccione los invernaderos o áreas:';
            }
            
            invernaderos.forEach(invernadero => {
                const item = document.createElement('div');
                
                // Aplicar clase especial para áreas especiales
                if (invernadero === 'Fitosanidad' || invernadero === 'Riego' || invernadero === 'Mantenimiento' || invernadero === 'Vivero') {
                    item.className = 'invernadero-item area-special';
                } else {
                    item.className = 'invernadero-item';
                }
                
                // Mostrar nombre apropiado
                if (invernadero === 'Fitosanidad' || invernadero === 'Riego' || invernadero === 'Mantenimiento' || invernadero === 'Vivero') {
                    item.textContent = invernadero;
                } else {
                    item.textContent = 'Invernadero ' + invernadero;
                }
                
                item.dataset.invernadero = invernadero;
                
                item.addEventListener('click', function() {
                    this.classList.toggle('selected');
                    
                    const invernaderoId = this.dataset.invernadero;
                    if (this.classList.contains('selected')) {
                        // Agregar a la selección
                        if (!invernaderosSeleccionados.includes(invernaderoId)) {
                            invernaderosSeleccionados.push(invernaderoId);
                        }
                    } else {
                        // Quitar de la selección
                        invernaderosSeleccionados = invernaderosSeleccionados.filter(i => i !== invernaderoId);
                    }
                    
                    document.getElementById('invernaderos-seleccionados').value = invernaderosSeleccionados.join(',');
                    
                    // Ocultar mensaje de error si existe
                    document.getElementById('invernadero-error').style.display = 'none';
                    
                    actualizarVistaPrevia();
                });
                
                contenedor.appendChild(item);
            });
        }

        // Validar formulario
        function validarFormulario() {
            let valido = true;
            const nombre = document.getElementById('nombre');
            const codigo = document.getElementById('codigo');
            const puesto = document.getElementById('puesto');
            
            // Validar nombre
            if (!nombre.value.trim()) {
                nombre.classList.add('is-invalid');
                valido = false;
            } else {
                nombre.classList.remove('is-invalid');
            }
            
            // Validar código
            if (!codigo.value.trim()) {
                codigo.classList.add('is-invalid');
                valido = false;
            } else {
                codigo.classList.remove('is-invalid');
            }
            
            // Validar puesto
            if (!puesto.value) {
                puesto.classList.add('is-invalid');
                valido = false;
            } else {
                puesto.classList.remove('is-invalid');
            }
            
            // Validar módulo
            if (!moduloSeleccionado) {
                document.getElementById('modulo-error').style.display = 'block';
                valido = false;
            } else {
                document.getElementById('modulo-error').style.display = 'none';
            }
            
            // Validar invernaderos
            if (invernaderosSeleccionados.length === 0) {
                document.getElementById('invernadero-error').style.display = 'block';
                valido = false;
            } else {
                document.getElementById('invernadero-error').style.display = 'none';
            }
            
            return valido;
        }

        // Actualizar vista previa
        function actualizarVistaPrevia() {
            document.getElementById('preview-nombre').textContent = document.getElementById('nombre').value || '-';
            document.getElementById('preview-codigo').textContent = document.getElementById('codigo').value || '-';
            
            const puestoSelect = document.getElementById('puesto');
            const puestoTexto = puestoSelect.options[puestoSelect.selectedIndex]?.text || '-';
            document.getElementById('preview-puesto').textContent = puestoTexto;
            
            document.getElementById('preview-modulo').textContent = moduloSeleccionado || '-';
            
            if (invernaderosSeleccionados.length > 0) {
                // Mostrar nombres apropiados según el tipo
                const nombresMostrar = invernaderosSeleccionados.map(i => {
                    if (i === 'Fitosanidad' || i === 'Riego' || i === 'Mantenimiento' || i === 'Vivero') {
                        return i;
                    } else {
                        return 'Invernadero ' + i;
                    }
                }).join(', ');
                
                document.getElementById('preview-invernaderos').textContent = nombresMostrar;
            } else {
                document.getElementById('preview-invernaderos').textContent = '-';
            }
        }

        // Guardar empleado en Firebase
        function guardarEmpleado() {
            const empleado = {
                nombre: document.getElementById('nombre').value.trim(),
                codigo: document.getElementById('codigo').value.trim(),
                puesto: document.getElementById('puesto').value,
                modulo: moduloSeleccionado,
                invernaderos: invernaderosSeleccionados,
                telefono: document.getElementById('telefono').value.trim(),
                email: document.getElementById('email').value.trim(),
                fechaIngreso: document.getElementById('fecha-ingreso').value,
                observaciones: document.getElementById('observaciones').value.trim(),
                fechaRegistro: new Date().toISOString(),
                registradoPor: JSON.parse(sessionStorage.getItem('currentUser'))?.username || 'admin'
            };

            // Guardar en Firebase
            personalRef.push(empleado)
                .then(() => {
                    // Mostrar mensaje de éxito
                    document.getElementById('toast-message').textContent = 'Empleado guardado correctamente en Firebase';
                    document.querySelector('.toast-header i').className = 'fas fa-check-circle me-2 text-success';
                    toastBootstrap.show();
                    
                    // Resetear formulario
                    resetFormulario();
                })
                .catch((error) => {
                    console.error('Error al guardar el empleado:', error);
                    document.getElementById('toast-message').textContent = 'Error al guardar el empleado. Por favor, intente nuevamente.';
                    document.querySelector('.toast-header i').className = 'fas fa-exclamation-circle me-2 text-danger';
                    toastBootstrap.show();
                });
        }

        // Resetear formulario
        function resetFormulario() {
            document.getElementById('employee-form').reset();
            moduloSeleccionado = '';
            invernaderosSeleccionados = [];
            document.querySelectorAll('.module-badge').forEach(m => m.classList.remove('selected'));
            document.querySelectorAll('.invernadero-item').forEach(i => i.classList.remove('selected'));
            document.getElementById('contenedor-invernaderos').innerHTML = '<div class="alert alert-info">Primero seleccione un módulo para ver las opciones disponibles</div>';
            document.getElementById('invernadero-text').textContent = 'Seleccione los invernaderos o áreas:';
            document.querySelectorAll('.invalid-feedback').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
            actualizarVistaPrevia();
        }