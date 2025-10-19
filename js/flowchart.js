class FlowchartEditor {
    constructor(svgElement) {
        this.svg = svgElement;
        this.elements = new Map();
        this.connections = new Map();
        this.selectedElement = null;
        this.currentTool = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.connectionStart = null;
        this.tempLine = null;
        this.editingElementId = null;
        
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        
        this.initializeEventListeners();
        this.initializeTextEditModal();
    }

    initializeEventListeners() {
        this.svg.addEventListener('click', this.handleCanvasClick);
        this.svg.addEventListener('mousedown', this.handleMouseDown);
        this.svg.addEventListener('mousemove', this.handleMouseMove);
        this.svg.addEventListener('mouseup', this.handleMouseUp);
        this.svg.addEventListener('contextmenu', (e) => e.preventDefault());
        document.addEventListener('keydown', this.handleKeyDown);
    }

    initializeTextEditModal() {
        // Usar setTimeout para asegurar que el DOM esté cargado
        setTimeout(() => {
            const confirmBtn = document.getElementById('confirm-edit');
            const cancelBtn = document.getElementById('cancel-edit');
            const textInput = document.getElementById('element-text-input');
            
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.saveElementText();
                });
            } else {
                console.warn('Confirm edit button not found');
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.cancelEditText();
                });
            } else {
                console.warn('Cancel edit button not found');
            }
            
            if (textInput) {
                textInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        this.saveElementText();
                    } else if (e.key === 'Escape') {
                        this.cancelEditText();
                    }
                });
            } else {
                console.warn('Text input not found');
            }
        }, 0);
    }

    setTool(tool) {
        this.currentTool = tool;
        this.selectedElement = null;
        this.updateCursor();
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (tool) {
            const toolBtn = document.querySelector(`[data-tool="${tool}"]`);
            if (toolBtn) toolBtn.classList.add('active');
        }
    }

    updateCursor() {
        if (this.currentTool === 'connector') {
            this.svg.style.cursor = 'crosshair';
        } else if (this.currentTool) {
            this.svg.style.cursor = 'crosshair';
        } else {
            this.svg.style.cursor = 'default';
        }
    }

    handleCanvasClick(e) {
        if (e.target === this.svg) {
            if (this.currentTool && this.currentTool !== 'connector') {
                // Crear nuevo elemento
                const pos = Utils.getMousePosition(e, this.svg);
                this.createElement(this.currentTool, pos.x, pos.y);
            } else {
                // Deseleccionar elemento al hacer click en canvas vacío
                this.deselectElement();
            }
        }
    }

    handleMouseDown(e) {
        e.preventDefault();
        
        const connectionPoint = e.target.closest('.connection-point');
        const element = e.target.closest('.flowchart-element');
        
        if (this.currentTool === 'connector') {
            if (connectionPoint && element) {
                const id = element.getAttribute('data-id');
                const pointIndex = parseInt(connectionPoint.getAttribute('data-point'));
                this.startConnection(id, pointIndex, e);
            }
        } else if (element) {
            const id = element.getAttribute('data-id');
            this.startDrag(id, e);
        }
    }

    handleMouseMove(e) {
        if (this.isDragging && this.selectedElement) {
            const pos = Utils.getMousePosition(e, this.svg);
            const newX = pos.x - this.dragOffset.x;
            const newY = pos.y - this.dragOffset.y;
            this.moveElement(this.selectedElement, newX, newY);
        } else if (this.tempLine) {
            const pos = Utils.getMousePosition(e, this.svg);
            this.tempLine.setAttribute('x2', pos.x);
            this.tempLine.setAttribute('y2', pos.y);
        }
    }

    handleMouseUp(e) {
        if (this.tempLine) {
            const connectionPoint = e.target.closest('.connection-point');
            const element = e.target.closest('.flowchart-element');
            
            if (connectionPoint && element) {
                const endElementId = element.getAttribute('data-id');
                const endPoint = parseInt(connectionPoint.getAttribute('data-point'));
                
                if (endElementId !== this.connectionStart.elementId) {
                    this.createConnection(
                        this.connectionStart.elementId,
                        this.connectionStart.point,
                        endElementId,
                        endPoint
                    );
                }
            }
            
            this.svg.removeChild(this.tempLine);
            this.tempLine = null;
            this.connectionStart = null;
        }
        
        this.isDragging = false;
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedElement) {
            this.deleteElement(this.selectedElement);
        } else if (e.key === 'Escape') {
            if (this.selectedElement) {
                const element = this.elements.get(this.selectedElement);
                if (element && element.element) {
                    element.element.classList.remove('selected');
                    const text = element.element.querySelector('.element-text');
                    if (text) {
                        text.style.fill = '#333';
                        text.style.fontWeight = 'normal';
                    }
                }
            }
            
            this.selectedElement = null;
            this.currentTool = null;
            this.updateCursor();
            document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
        }
    }

    getDefaultText(type) {
        switch (type) {
            case 'start': return 'Inicio';
            case 'process': return 'Proceso';
            case 'decision': return '¿Decisión?';
            default: return 'Texto';
        }
    }

    createElement(type, x, y) {
        const id = Utils.generateId();
        console.log('Creating element with ID:', id);
        
        let element;

        switch (type) {
            case 'start':
                element = this.createStartElement(id, x, y);
                break;
            case 'process':
                element = this.createProcessElement(id, x, y);
                break;
            case 'decision':
                element = this.createDecisionElement(id, x, y);
                break;
            default:
                return;
        }

        this.elements.set(id, {
            type: type,
            element: element,
            x: x,
            y: y,
            text: this.getDefaultText(type)
        });

        console.log('Element created and stored:', id);
        console.log('Current elements in map:', Array.from(this.elements.keys()));

        this.svg.appendChild(element);
        this.selectElement(id);
    }

    createStartElement(id, x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'flowchart-element');
        group.setAttribute('data-id', id);

        const ellipse = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        ellipse.setAttribute('cx', 0);
        ellipse.setAttribute('cy', 0);
        ellipse.setAttribute('rx', 60);
        ellipse.setAttribute('ry', 30);
        ellipse.setAttribute('fill', '#e8f5e8');
        ellipse.setAttribute('stroke', '#4CAF50');
        ellipse.setAttribute('stroke-width', '2');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'element-text');
        text.textContent = 'Inicio';

        this.addConnectionPoints(group, [
            { x: 0, y: -30 }, { x: 60, y: 0 }, { x: 0, y: 30 }, { x: -60, y: 0 }
        ]);

        group.appendChild(ellipse);
        group.appendChild(text);
        group.setAttribute('transform', `translate(${x}, ${y})`);

        this.addElementEventListeners(group, id);
        return group;
    }

    createProcessElement(id, x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'flowchart-element');
        group.setAttribute('data-id', id);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', -75);
        rect.setAttribute('y', -25);
        rect.setAttribute('width', 150);
        rect.setAttribute('height', 50);
        rect.setAttribute('fill', '#e3f2fd');
        rect.setAttribute('stroke', '#2196F3');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('rx', '5');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'element-text');
        text.textContent = 'Proceso';

        this.addConnectionPoints(group, [
            { x: 0, y: -25 }, { x: 75, y: 0 }, { x: 0, y: 25 }, { x: -75, y: 0 }
        ]);

        group.appendChild(rect);
        group.appendChild(text);
        group.setAttribute('transform', `translate(${x}, ${y})`);

        this.addElementEventListeners(group, id);
        return group;
    }

    createDecisionElement(id, x, y) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'flowchart-element');
        group.setAttribute('data-id', id);

        const diamond = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        diamond.setAttribute('points', '0,-35 70,0 0,35 -70,0');
        diamond.setAttribute('fill', '#fff3e0');
        diamond.setAttribute('stroke', '#FF9800');
        diamond.setAttribute('stroke-width', '2');

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('class', 'element-text');
        text.textContent = '¿Decisión?';

        this.addConnectionPoints(group, [
            { x: 0, y: -35 }, { x: 70, y: 0 }, { x: 0, y: 35 }, { x: -70, y: 0 }
        ]);

        group.appendChild(diamond);
        group.appendChild(text);
        group.setAttribute('transform', `translate(${x}, ${y})`);

        this.addElementEventListeners(group, id);
        return group;
    }

    addConnectionPoints(group, points) {
        points.forEach((point, index) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('class', 'connection-point');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', 6);
            circle.setAttribute('data-point', index);
            circle.style.pointerEvents = 'all';
            group.appendChild(circle);
        });
    }

    addElementEventListeners(element, id) {
        element.style.pointerEvents = 'all';
        
        // Usar arrow function para mantener el contexto
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            // Buscar el ID desde el elemento DOM directamente
            const actualId = element.getAttribute('data-id');
            console.log('Double-click on element:', actualId);
            
            if (this.currentTool !== 'connector') {
                // Verificar que el elemento existe en el Map
                if (this.elements.has(actualId)) {
                    this.editElementText(actualId);
                } else {
                    console.error('Element not in map:', actualId, 'Available:', Array.from(this.elements.keys()));
                }
            }
        });

        element.addEventListener('click', (e) => {
            e.stopPropagation();
            
            const actualId = element.getAttribute('data-id');
            
            if (this.currentTool !== 'connector') {
                if (this.elements.has(actualId)) {
                    this.selectElement(actualId);
                }
            }
        });
    }

    startDrag(id, e) {
        if (this.currentTool === 'connector') return;
        
        this.isDragging = true;
        this.selectedElement = id;
        const pos = Utils.getMousePosition(e, this.svg);
        const elementData = this.elements.get(id);
        
        this.dragOffset = {
            x: pos.x - elementData.x,
            y: pos.y - elementData.y
        };
        
        this.selectElement(id);
    }

    startConnection(elementId, pointIndex, e) {
        const elementData = this.elements.get(elementId);
        if (!elementData) return;
        
        this.connectionStart = {
            elementId: elementId,
            point: pointIndex
        };
        
        const startPos = this.getConnectionPointPosition(elementData, pointIndex);
        
        this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.tempLine.setAttribute('x1', startPos.x);
        this.tempLine.setAttribute('y1', startPos.y);
        this.tempLine.setAttribute('x2', startPos.x);
        this.tempLine.setAttribute('y2', startPos.y);
        this.tempLine.setAttribute('stroke', '#2196F3');
        this.tempLine.setAttribute('stroke-width', '3');
        this.tempLine.setAttribute('stroke-dasharray', '5,5');
        this.tempLine.style.pointerEvents = 'none';
        
        this.svg.appendChild(this.tempLine);
    }

    createConnection(startId, startPoint, endId, endPoint) {
        const connectionId = Utils.generateId();
        const startElement = this.elements.get(startId);
        const endElement = this.elements.get(endId);
        
        if (!startElement || !endElement) return;
        
        const startPos = this.getConnectionPointPosition(startElement, startPoint);
        const endPos = this.getConnectionPointPosition(endElement, endPoint);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'connector-line');
        line.setAttribute('x1', startPos.x);
        line.setAttribute('y1', startPos.y);
        line.setAttribute('x2', endPos.x);
        line.setAttribute('y2', endPos.y);
        line.setAttribute('stroke', '#333');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('marker-end', 'url(#arrowhead)');
        line.style.pointerEvents = 'none';
        
        this.connections.set(connectionId, {
            line: line,
            startId: startId,
            startPoint: startPoint,
            endId: endId,
            endPoint: endPoint
        });
        
        const defs = this.svg.querySelector('defs');
        if (defs && defs.nextSibling) {
            this.svg.insertBefore(line, defs.nextSibling);
        } else {
            this.svg.appendChild(line);
        }
        
        this.elements.forEach((elementData) => {
            this.svg.appendChild(elementData.element);
        });
    }

    getConnectionPointPosition(elementData, pointIndex) {
        const points = this.getConnectionPoints(elementData.type);
        const point = points[pointIndex];
        return {
            x: elementData.x + point.x,
            y: elementData.y + point.y
        };
    }

    getConnectionPoints(type) {
        switch (type) {
            case 'start':
                return [{ x: 0, y: -30 }, { x: 60, y: 0 }, { x: 0, y: 30 }, { x: -60, y: 0 }];
            case 'process':
                return [{ x: 0, y: -25 }, { x: 75, y: 0 }, { x: 0, y: 25 }, { x: -75, y: 0 }];
            case 'decision':
                return [{ x: 0, y: -35 }, { x: 70, y: 0 }, { x: 0, y: 35 }, { x: -70, y: 0 }];
            default:
                return [];
        }
    }

    moveElement(id, x, y) {
        const elementData = this.elements.get(id);
        if (!elementData) return;
        
        elementData.x = x;
        elementData.y = y;
        elementData.element.setAttribute('transform', `translate(${x}, ${y})`);
        
        this.svg.appendChild(elementData.element);
        this.updateConnections(id);
    }

    updateConnections(elementId) {
        this.connections.forEach((connection) => {
            if (connection.startId === elementId) {
                const startElement = this.elements.get(elementId);
                if (startElement) {
                    const startPos = this.getConnectionPointPosition(startElement, connection.startPoint);
                    connection.line.setAttribute('x1', startPos.x);
                    connection.line.setAttribute('y1', startPos.y);
                }
            }
            
            if (connection.endId === elementId) {
                const endElement = this.elements.get(elementId);
                if (endElement) {
                    const endPos = this.getConnectionPointPosition(endElement, connection.endPoint);
                    connection.line.setAttribute('x2', endPos.x);
                    connection.line.setAttribute('y2', endPos.y);
                }
            }
        });
    }

    selectElement(id) {
        console.log('Selecting element:', id);
        
        if (this.selectedElement) {
            const prevElement = this.elements.get(this.selectedElement);
            if (prevElement && prevElement.element) {
                prevElement.element.classList.remove('selected');
                const prevText = prevElement.element.querySelector('.element-text');
                if (prevText) {
                    prevText.style.fill = '#333';
                    prevText.style.fontWeight = 'normal';
                }
            }
        }
        
        this.selectedElement = id;
        const element = this.elements.get(id);
        
        if (element && element.element) {
            element.element.classList.add('selected');
            const text = element.element.querySelector('.element-text');
            if (text) {
                text.style.fill = '#2196F3';
                text.style.fontWeight = 'bold';
            }
            
            // Habilitar botón de eliminar si existe
            const deleteBtn = document.getElementById('btn-delete');
            if (deleteBtn) {
                deleteBtn.disabled = false;
            }
        } else {
            console.warn('Element not found when selecting:', id);
        }
    }

    deselectElement() {
        if (this.selectedElement) {
            const element = this.elements.get(this.selectedElement);
            if (element && element.element) {
                element.element.classList.remove('selected');
                const text = element.element.querySelector('.element-text');
                if (text) {
                    text.style.fill = '#333';
                    text.style.fontWeight = 'normal';
                }
            }
            this.selectedElement = null;
            console.log('Element deselected');
            
            // Deshabilitar botón de eliminar si existe
            const deleteBtn = document.getElementById('btn-delete');
            if (deleteBtn) {
                deleteBtn.disabled = true;
            }
        }
    }

    editElementText(id) {
        console.log('Attempting to edit element:', id);
        console.log('Available elements:', Array.from(this.elements.keys()));
        
        const elementData = this.elements.get(id);
        
        if (!elementData) {
            console.error('Element not found in Map:', id);
            console.error('Map contents:', this.elements);
            alert('Error: Elemento no encontrado. Por favor, intenta de nuevo.');
            return;
        }
        
        this.editingElementId = id;
        const textElement = elementData.element.querySelector('.element-text');
        
        if (!textElement) {
            console.error('Text element not found in SVG');
            return;
        }
        
        const currentText = textElement.textContent;
        
        const textInput = document.getElementById('element-text-input');
        const modal = document.getElementById('edit-text-modal');
        
        if (!textInput) {
            console.error('Text input element not found');
            alert('Error: Modal de edición no encontrado');
            return;
        }
        
        if (!modal) {
            console.error('Modal element not found');
            alert('Error: Modal no encontrado');
            return;
        }
        
        console.log('Opening modal for:', id, 'with text:', currentText);
        textInput.value = currentText;
        Utils.showModal('edit-text-modal');
        
        setTimeout(() => {
            textInput.focus();
            textInput.select();
        }, 100);
    }

    saveElementText() {
        if (!this.editingElementId) {
            console.warn('No element is being edited');
            return;
        }
        
        const elementData = this.elements.get(this.editingElementId);
        if (!elementData) {
            console.error('Element data not found for:', this.editingElementId);
            return;
        }
        
        const textInput = document.getElementById('element-text-input');
        if (!textInput) {
            console.error('Text input not found');
            return;
        }
        
        const newText = textInput.value.trim();
        
        if (newText !== '') {
            const textElement = elementData.element.querySelector('.element-text');
            textElement.textContent = newText;
            elementData.text = newText;
            console.log('Text updated to:', newText);
        }
        
        Utils.hideModal('edit-text-modal');
        this.editingElementId = null;
    }

    cancelEditText() {
        console.log('Edit cancelled');
        Utils.hideModal('edit-text-modal');
        this.editingElementId = null;
    }

    deleteElement(id) {
        const elementData = this.elements.get(id);
        if (elementData && elementData.element) {
            // Remove connections
            this.connections.forEach((connection, connectionId) => {
                if (connection.startId === id || connection.endId === id) {
                    if (connection.line && connection.line.parentNode) {
                        this.svg.removeChild(connection.line);
                    }
                    this.connections.delete(connectionId);
                }
            });
            
            // Remove element
            if (elementData.element.parentNode) {
                this.svg.removeChild(elementData.element);
            }
            this.elements.delete(id);
            
            // Clear selection
            if (this.selectedElement === id) {
                this.selectedElement = null;
                
                // Deshabilitar botón de eliminar
                const deleteBtn = document.getElementById('btn-delete');
                if (deleteBtn) {
                    deleteBtn.disabled = true;
                }
            }
            
            console.log('Element deleted:', id);
        }
    }

    clear() {
        this.elements.clear();
        this.connections.clear();
        this.selectedElement = null;
        this.svg.innerHTML = `
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                        refX="10" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#333" />
                </marker>
            </defs>
        `;
    }

    exportData() {
        const elementsData = {};
        const connectionsData = {};
        
        this.elements.forEach((data, id) => {
            elementsData[id] = {
                type: data.type,
                x: data.x,
                y: data.y,
                text: data.text
            };
        });
        
        this.connections.forEach((data, id) => {
            connectionsData[id] = {
                startId: data.startId,
                startPoint: data.startPoint,
                endId: data.endId,
                endPoint: data.endPoint
            };
        });
        
        return {
            elements: elementsData,
            connections: connectionsData
        };
    }

    importData(data) {
        this.clear();
        
        if (!data || !data.elements) {
            console.error('Invalid import data:', data);
            return;
        }
        
        console.log('Importing data with elements:', Object.keys(data.elements).length);
        
        // PASO 1: Crear elementos directamente con sus IDs originales
        Object.entries(data.elements).forEach(([originalId, elementData]) => {
            if (!elementData.type || elementData.x === undefined || elementData.y === undefined) {
                console.warn('Skipping invalid element:', originalId, elementData);
                return;
            }
            
            console.log('Creating element:', originalId, elementData.type);
            
            // Crear el elemento SVG con el ID original desde el inicio
            let element;
            switch (elementData.type) {
                case 'start':
                    element = this.createStartElement(originalId, elementData.x, elementData.y);
                    break;
                case 'process':
                    element = this.createProcessElement(originalId, elementData.x, elementData.y);
                    break;
                case 'decision':
                    element = this.createDecisionElement(originalId, elementData.x, elementData.y);
                    break;
                default:
                    console.warn('Unknown element type:', elementData.type);
                    return;
            }
            
            // Guardar directamente con el ID original
            this.elements.set(originalId, {
                type: elementData.type,
                element: element,
                x: elementData.x,
                y: elementData.y,
                text: elementData.text || this.getDefaultText(elementData.type)
            });
            
            // Actualizar el texto del elemento
            const textElement = element.querySelector('.element-text');
            if (textElement && elementData.text) {
                textElement.textContent = elementData.text;
            }
            
            // Agregar al SVG
            this.svg.appendChild(element);
            
            console.log('Element created successfully:', originalId);
        });
        
        console.log('Elements imported:', Array.from(this.elements.keys()));
        
        // PASO 2: Crear conexiones
        if (data.connections && Object.keys(data.connections).length > 0) {
            console.log('Importing connections:', Object.keys(data.connections).length);
            
            Object.entries(data.connections).forEach(([connectionId, connectionData]) => {
                const startExists = this.elements.has(connectionData.startId);
                const endExists = this.elements.has(connectionData.endId);
                
                if (startExists && endExists) {
                    this.createConnection(
                        connectionData.startId,
                        connectionData.startPoint,
                        connectionData.endId,
                        connectionData.endPoint
                    );
                    console.log('Connection created:', connectionId);
                } else {
                    console.warn('Skipping connection - missing elements:', {
                        connectionId,
                        startExists,
                        endExists,
                        startId: connectionData.startId,
                        endId: connectionData.endId
                    });
                }
            });
        }
        
        console.log('Import complete. Total elements:', this.elements.size);
    }
}
