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
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Canvas click events
        this.svg.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Prevent context menu
        this.svg.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    setTool(tool) {
        this.currentTool = tool;
        this.selectedElement = null;
        this.updateCursor();
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
        if (e.target === this.svg && this.currentTool && this.currentTool !== 'connector') {
            const pos = Utils.getMousePosition(e, this.svg);
            this.createElement(this.currentTool, pos.x, pos.y);
        }
    }

    createElement(type, x, y) {
        const id = Utils.generateId();
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

        // Connection points
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

        // Connection points
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

        // Connection points
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
            circle.setAttribute('data-point', index);
            group.appendChild(circle);
        });
    }

    addElementEventListeners(element, id) {
        element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            if (this.currentTool === 'connector') {
                this.startConnection(id, e);
            } else {
                this.startDrag(id, e);
            }
        });

        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editElementText(id);
        });

        element.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectElement(id);
        });
    }

    startDrag(id, e) {
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

    startConnection(id, e) {
        if (e.target.classList.contains('connection-point')) {
            this.connectionStart = {
                elementId: id,
                point: parseInt(e.target.getAttribute('data-point'))
            };
            
            const elementData = this.elements.get(id);
            const startPos = this.getConnectionPointPosition(elementData, this.connectionStart.point);
            
            this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            this.tempLine.setAttribute('x1', startPos.x);
            this.tempLine.setAttribute('y1', startPos.y);
            this.tempLine.setAttribute('x2', startPos.x);
            this.tempLine.setAttribute('y2', startPos.y);
            this.tempLine.setAttribute('stroke', '#999');
            this.tempLine.setAttribute('stroke-width', '2');
            this.tempLine.setAttribute('stroke-dasharray', '5,5');
            
            this.svg.appendChild(this.tempLine);
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
            if (e.target.classList.contains('connection-point')) {
                const endElementId = e.target.closest('.flowchart-element').getAttribute('data-id');
                const endPoint = parseInt(e.target.getAttribute('data-point'));
                
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

    createConnection(startId, startPoint, endId, endPoint) {
        const connectionId = Utils.generateId();
        const startElement = this.elements.get(startId);
        const endElement = this.elements.get(endId);
        
        const startPos = this.getConnectionPointPosition(startElement, startPoint);
        const endPos = this.getConnectionPointPosition(endElement, endPoint);
        
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'connector-line');
        line.setAttribute('x1', startPos.x);
        line.setAttribute('y1', startPos.y);
        line.setAttribute('x2', endPos.x);
        line.setAttribute('y2', endPos.y);
        
        this.connections.set(connectionId, {
            line: line,
            startId: startId,
            startPoint: startPoint,
            endId: endId,
            endPoint: endPoint
        });
        
        this.svg.insertBefore(line, this.svg.firstChild);
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
        elementData.x = x;
        elementData.y = y;
        elementData.element.setAttribute('transform', `translate(${x}, ${y})`);
        
        // Update connections
        this.updateConnections(id);
    }

    updateConnections(elementId) {
        this.connections.forEach((connection) => {
            if (connection.startId === elementId) {
                const startElement = this.elements.get(elementId);
                const startPos = this.getConnectionPointPosition(startElement, connection.startPoint);
                connection.line.setAttribute('x1', startPos.x);
                connection.line.setAttribute('y1', startPos.y);
            }
            
            if (connection.endId === elementId) {
                const endElement = this.elements.get(elementId);
                const endPos = this.getConnectionPointPosition(endElement, connection.endPoint);
                connection.line.setAttribute('x2', endPos.x);
                connection.line.setAttribute('y2', endPos.y);
            }
        });
    }

    selectElement(id) {
        // Deselect previous
        if (this.selectedElement) {
            const prevElement = this.elements.get(this.selectedElement);
            if (prevElement) {
                prevElement.element.classList.remove('selected');
            }
        }
        
        // Select new
        this.selectedElement = id;
        const element = this.elements.get(id);
        if (element) {
            element.element.classList.add('selected');
        }
    }

    editElementText(id) {
        const elementData = this.elements.get(id);
        const textElement = elementData.element.querySelector('.element-text');
        const currentText = textElement.textContent;
        
        const newText = prompt('Editar texto:', currentText);
        if (newText !== null && newText.trim() !== '') {
            textElement.textContent = newText.trim();
            elementData.text = newText.trim();
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

    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedElement) {
            this.deleteElement(this.selectedElement);
        } else if (e.key === 'Escape') {
            this.selectedElement = null;
            this.currentTool = null;
            this.updateCursor();
        }
    }

    deleteElement(id) {
        const elementData = this.elements.get(id);
        if (elementData) {
            // Remove connections
            this.connections.forEach((connection, connectionId) => {
                if (connection.startId === id || connection.endId === id) {
                    this.svg.removeChild(connection.line);
                    this.connections.delete(connectionId);
                }
            });
            
            // Remove element
            this.svg.removeChild(elementData.element);
            this.elements.delete(id);
            this.selectedElement = null;
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
        
        // Import elements
        Object.entries(data.elements).forEach(([id, elementData]) => {
            this.createElement(elementData.type, elementData.x, elementData.y);
            const lastElement = Array.from(this.elements.keys()).pop();
            
            // Update the element data
            const element = this.elements.get(lastElement);
            element.text = elementData.text;
            const textElement = element.element.querySelector('.element-text');
            textElement.textContent = elementData.text;
            
            // Update the map with correct ID
            this.elements.delete(lastElement);
            this.elements.set(id, element);
            element.element.setAttribute('data-id', id);
        });
        
        // Import connections
        Object.entries(data.connections).forEach(([id, connectionData]) => {
            this.createConnection(
                connectionData.startId,
                connectionData.startPoint,
                connectionData.endId,
                connectionData.endPoint
            );
        });
    }
}
