// Sistema de temas global para Agroalpha
class ThemeManager {
    constructor() {
        this.themes = ['light', 'dark', 'blue', 'orange', 'purple'];
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        this.loadSavedTheme();
        this.applyTheme(this.currentTheme);
    }

    loadSavedTheme() {
        const savedTheme = localStorage.getItem('agroalpha-theme');
        if (savedTheme && this.themes.includes(savedTheme)) {
            this.currentTheme = savedTheme;
        }
        return this.currentTheme;
    }

    applyTheme(themeName) {
        if (!this.themes.includes(themeName)) {
            console.warn(`Tema "${themeName}" no encontrado. Usando tema por defecto.`);
            themeName = 'light';
        }

        document.body.setAttribute('data-theme', themeName);
        this.currentTheme = themeName;
        localStorage.setItem('agroalpha-theme', themeName);

        // Disparar evento personalizado para notificar el cambio de tema
        window.dispatchEvent(new CustomEvent('themeChanged', {
            detail: { theme: themeName }
        }));

        console.log(`Tema aplicado: ${themeName}`);
    }

    getCurrentTheme() {
        return this.currentTheme;
    }

    getAvailableThemes() {
        return [...this.themes];
    }

    cycleTheme() {
        const currentIndex = this.themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % this.themes.length;
        this.applyTheme(this.themes[nextIndex]);
        return this.themes[nextIndex];
    }
}

// Crear instancia global
window.agroalphaThemeManager = new ThemeManager();

// Función de conveniencia para uso global
window.applyAgroalphaTheme = function(themeName) {
    return window.agroalphaThemeManager.applyTheme(themeName);
};

// Cargar automáticamente al iniciar
document.addEventListener('DOMContentLoaded', function() {
    window.agroalphaThemeManager.init();
});