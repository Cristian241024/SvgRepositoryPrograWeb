class App {
    constructor() {
        this.flowchartEditor = null;
        this.storageManager = null;
        this.init();
    }

    init() {
        const svg = document.getElementById('flowchart-canvas');
        this.flowchartEditor = new FlowchartEditor(svg);
        this.storageManager = new StorageManager();
        
        window.flowchartEditor = this.flowchartEditor;
        
        this.initializeEventListeners();
        this.loadAutoSave();
    }

    initializeEventListeners() {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.getAttribute('data-tool');
                this.selectTool(tool, e.target);
            });
        });

        document.getElementById('btn-save').addEventListener('click', () => this.showSaveModal());
        document.getElementById('btn-load').addEventListener('click', () => this.showLoadModal());
        document.getElementById('btn-export').addEventListener('click', () => this.exportDiagram());
        document.getElementById('btn-import').addEventListener('click', () => this.importDiagram());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearDiagram());

        document.getElementById('confirm-save').addEventListener('click', () => this.saveDiagram());
        document.getElementById('cancel-save').addEventListener('click', () => Utils.hideModal('save-modal'));
        document.getElementById('cancel-load').addEventListener('click', () => Utils.hideModal('load-modal'));

        document.getElementById('import-file').addEventListener('change', (e) => this.handleFileImport(e));

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        document.getElementById('diagram-name').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveDiagram();
            }
        });
    }

    selectTool(tool, button) {
        this.flowchartEditor.setTool(tool);
    }

    showSaveModal() {
        const modal = document.getElementById('save-modal');
        const input = document.getElementById('diagram-name');
        
        const date = new Date();
        const defaultName = `Diagrama_${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}-${date.getMinutes().toString().padStart(2,'0')}`;
        
        input.value = defaultName;
        Utils.showModal('save-modal');
        input.focus();
        input.select();
    }

    saveDiagram() {
        const name = document.getElementById('diagram-name').value.trim();
        
        if (!name) {
            alert('Por favor, ingresa un nombre para el diagrama.');
            return;
        }

        const data = this.flowchartEditor.exportData();
        
        if (this.storageManager.saveDiagram(name, data)) {
            Utils.hideModal('save-modal');
            this.showNotification('Diagrama guardado exitosamente', 'success');
        } else {
            alert('Error al guardar el diagrama. Verifica el espacio de almacenamiento.');
        }
    }

    showLoadModal() {
        const modal = document.getElementById('load-modal');
        const container = document.getElementById('saved-diagrams');
        
        container.innerHTML = '';
        
        const diagrams = this.storageManager.getAllDiagrams();
        
        if (Object.keys(diagrams).length === 0) {
            container.innerHTML = '<p>No hay diagramas guardados.</p>';
        } else {
            Object.entries(diagrams).forEach(([name, data]) => {
                const diagramElement = document.createElement('div');
                diagramElement.className = 'saved-diagram';
                
                const lastModified = Utils.formatDate(new Date(data.lastModified));
                
                diagramElement.innerHTML = `
                    <div>
                        <strong>${name}</strong>
                        <br>
                        <small>Modificado: ${lastModified}</small>
                    </div>
                    <button class="delete-diagram" data-name="${name}">Eliminar</button>
                `;
                
                diagramElement.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('delete-diagram')) {
                        this.loadDiagram(name);
                        Utils.hideModal('load-modal');
                    }
                });
                
                diagramElement.querySelector('.delete-diagram').addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(`¿Estás seguro de eliminar "${name}"?`)) {
                        this.storageManager.deleteDiagram(name);
                        this.showLoadModal();
                    }
                });
                
                container.appendChild(diagramElement);
            });
        }
        
        Utils.showModal('load-modal');
    }

    loadDiagram(name) {
        const diagramData = this.storageManager.loadDiagram(name);
        
        if (diagramData) {
            this.flowchartEditor.importData(diagramData.data);
            this.showNotification(`Diagrama "${name}" cargado exitosamente`, 'success');
        } else {
            alert('Error al cargar el diagrama.');
        }
    }

    exportDiagram() {
        const data = this.flowchartEditor.exportData();
        const filename = prompt('Nombre del archivo:', 'mi_diagrama.json');
        
        if (filename) {
            this.storageManager.exportToJSON(data, filename);
            this.showNotification('Diagrama exportado exitosamente', 'success');
        }
    }

    importDiagram() {
        document.getElementById('import-file').click();
    }

    handleFileImport(e) {
        const file = e.target.files[0];
        
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    
                    if (data.diagram && data.diagram.elements && data.diagram.connections) {
                        this.flowchartEditor.importData(data.diagram);
                        this.showNotification('Diagrama importado exitosamente', 'success');
                    } else {
                        throw new Error('Formato de archivo inválido');
                    }
                } catch (error) {
                    alert('Error al importar el archivo: ' + error.message);
                }
            };
            
            reader.readAsText(file);
        } else {
            alert('Por favor, selecciona un archivo JSON válido.');
        }
        
        e.target.value = '';
    }

    clearDiagram() {
        if (confirm('¿Estás seguro de que quieres limpiar el diagrama? Esta acción no se puede deshacer.')) {
            this.flowchartEditor.clear();
            this.showNotification('Diagrama limpiado', 'warning');
        }
    }

    loadAutoSave() {
        const autoSaveData = this.storageManager.loadAutoSave();
        
        if (autoSaveData) {
            const timeDiff = new Date() - new Date(autoSaveData.timestamp);
            const hours = timeDiff / (1000 * 60 * 60);
            
            if (hours < 24) {
                if (confirm('Se encontró un diagrama guardado automáticamente. ¿Deseas cargarlo?')) {
                    this.flowchartEditor.importData(autoSaveData.data);
                }
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 2rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            opacity: '0',
            transition: 'opacity 0.3s ease',
            maxWidth: '300px'
        });
        
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#4CAF50';
                break;
            case 'warning':
                notification.style.backgroundColor = '#FF9800';
                break;
            case 'error':
                notification.style.backgroundColor = '#f44336';
                break;
            default:
                notification.style.backgroundColor = '#2196F3';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 100);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new App();
});
