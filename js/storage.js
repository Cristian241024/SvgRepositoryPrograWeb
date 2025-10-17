class StorageManager {
    constructor() {
        this.DIAGRAMS_KEY = 'flowchart_diagrams';
        this.CURRENT_KEY = 'flowchart_current';
        this.autoSaveInterval = null;
        this.startAutoSave();
    }

    saveDiagram(name, diagramData) {
        try {
            const diagrams = this.getAllDiagrams();
            diagrams[name] = {
                data: diagramData,
                lastModified: new Date().toISOString(),
                id: Utils.generateId()
            };
            localStorage.setItem(this.DIAGRAMS_KEY, JSON.stringify(diagrams));
            return true;
        } catch (error) {
            console.error('Error saving diagram:', error);
            return false;
        }
    }

    loadDiagram(name) {
        try {
            const diagrams = this.getAllDiagrams();
            return diagrams[name] || null;
        } catch (error) {
            console.error('Error loading diagram:', error);
            return null;
        }
    }

    getAllDiagrams() {
        try {
            const diagrams = localStorage.getItem(this.DIAGRAMS_KEY);
            return diagrams ? JSON.parse(diagrams) : {};
        } catch (error) {
            console.error('Error getting all diagrams:', error);
            return {};
        }
    }

    deleteDiagram(name) {
        try {
            const diagrams = this.getAllDiagrams();
            delete diagrams[name];
            localStorage.setItem(this.DIAGRAMS_KEY, JSON.stringify(diagrams));
            return true;
        } catch (error) {
            console.error('Error deleting diagram:', error);
            return false;
        }
    }

    autoSave(diagramData) {
        try {
            sessionStorage.setItem(this.CURRENT_KEY, JSON.stringify({
                data: diagramData,
                timestamp: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error auto-saving:', error);
        }
    }

    loadAutoSave() {
        try {
            const saved = sessionStorage.getItem(this.CURRENT_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch (error) {
            console.error('Error loading auto-save:', error);
            return null;
        }
    }

    startAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            if (window.flowchartEditor) {
                const data = window.flowchartEditor.exportData();
                this.autoSave(data);
            }
        }, 30000); // Auto-save every 30 seconds
    }

    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
    }

    exportToJSON(diagramData, filename = 'flowchart.json') {
        const exportData = {
            version: '1.0',
            created: new Date().toISOString(),
            diagram: diagramData
        };
        Utils.downloadJSON(exportData, filename);
    }

    getStorageInfo() {
        const diagrams = this.getAllDiagrams();
        return {
            count: Object.keys(diagrams).length,
            size: new Blob([JSON.stringify(diagrams)]).size,
            lastModified: Math.max(...Object.values(diagrams).map(d => new Date(d.lastModified).getTime()))
        };
    }
}
