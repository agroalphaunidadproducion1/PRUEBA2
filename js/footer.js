// footer.js - Pie de página para Sistema Agroalpha

class FooterManager {
    constructor() {
        this.init();
    }

    init() {
        this.crearFooter();
        this.agregarEventListeners();
    }

    crearFooter() {
        const footer = document.createElement('footer');
        footer.innerHTML = this.generarHTML();
        footer.style.cssText = this.obtenerEstilosFooter();
        document.body.appendChild(footer);
    }

    generarHTML() {
        return `
            <div class="footer-container">
                <div class="footer-content">
                    <p>Sistema Agroalpha © ${new Date().getFullYear()} | Versión 1.2.0</p>
                    <p>Unidad de Producción 1 - <a href="soporte.html" class="footer-link">Ayuda Técnica</a></p>
                </div>
            </div>
        `;
    }

    obtenerEstilosFooter() {
        return `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            background-color: rgba(255, 255, 255, 0.95);
            padding: 15px 0;
            text-align: center;
            border-top: 1px solid #e0e0e0;
            font-family: 'Roboto', sans-serif;
            z-index: 1000;
            backdrop-filter: blur(5px);
        `;
    }

    aplicarEstilosDinamicos() {
        const style = document.createElement('style');
        style.textContent = `
            .footer-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }

            .footer-content {
                color: #757575;
                font-size: 12px;
                line-height: 1.5;
            }

            .footer-content p {
                margin: 5px 0;
            }

            .footer-link {
                color: #4CAF50;
                text-decoration: none;
                transition: color 0.3s;
                cursor: pointer;
            }

            .footer-link:hover {
                color: #388E3C;
                text-decoration: underline;
            }

            @media (max-width: 768px) {
                .footer-content {
                    font-size: 11px;
                }
                
                .footer-container {
                    padding: 0 15px;
                }
            }

            @media (max-width: 480px) {
                .footer-content {
                    font-size: 10px;
                }
                
                footer {
                    padding: 10px 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    agregarEventListeners() {
        // Aplicar estilos después de que el DOM esté completamente cargado
        document.addEventListener('DOMContentLoaded', () => {
            this.aplicarEstilosDinamicos();
            this.ajustarPosicion();
        });

        // Ajustar posición en redimensionamiento
        window.addEventListener('resize', () => {
            this.ajustarPosicion();
        });

        // Manejar clic en el enlace de ayuda técnica
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('footer-link')) {
                e.preventDefault();
                window.location.href = 'soporte.html';
            }
        });
    }

    ajustarPosicion() {
        const footer = document.querySelector('footer');
        const bodyHeight = document.body.scrollHeight;
        const windowHeight = window.innerHeight;
        
        if (bodyHeight < windowHeight) {
            footer.style.position = 'fixed';
        } else {
            footer.style.position = 'relative';
        }
    }
}

// Inicializar el footer cuando el script se carga
const footer = new FooterManager();

// Exportar para uso en otros módulos si es necesario
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FooterManager;
}