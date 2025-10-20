# 📊 Editor de Diagramas de Flujo

Editor interactivo de diagramas de flujo desarrollado completamente con **JavaScript vanilla** y **SVG**, diseñado para crear y editar diagramas de flujo de algoritmia de forma visual e intuitiva.


## 🎯 Características Principales

### ✨ Editor Visual
- **Elementos de diagrama de flujo estándar:**
  - 🟢 **Inicio/Fin** - Terminadores (óvalos)
  - 🔵 **Proceso** - Operaciones (rectángulos)
  - 🟠 **Decisión** - Bifurcaciones (rombos)
- **Conexiones con flechas** entre elementos
- **Puntos de conexión interactivos** (4 por elemento)
- **Drag & Drop** para reorganizar elementos
- **Edición de texto** mediante modales elegantes

### 💾 Persistencia de Datos
- **Web Storage API:**
  - `LocalStorage` - Múltiples diagramas guardados permanentemente
- **Export/Import JSON:**
  - Descarga diagramas como archivos `.json`
  - Importa diagramas desde archivos locales
  - Compartible entre usuarios

### 🎨 Interfaz Moderna
- Diseño minimalista y profesional
- Iconos SVG personalizados
- Paleta de colores consistente
- Modales con animaciones suaves

### 📱 Responsive Design
- **Desktop:** Toolbar horizontal compacto
- **Tablet:** Elementos adaptables
- **Mobile:** Menú hamburguesa lateral
- **Touch Support:** PointerEvents API completo

---

## 🛠️ Tecnologías Utilizadas

### Core
- **JavaScript ES6+** (Vanilla - sin frameworks)
- **SVG** (Scalable Vector Graphics)
- **HTML5**
- **CSS3** (Variables CSS, Flexbox, Grid)

### APIs Web Nativas
| API | Uso |
|-----|-----|
| **PointerEvents API** | Soporte mouse, touch y pen |
| **Web Storage API** | LocalStorage + SessionStorage |
| **FileReader API** | Importar archivos JSON |
| **Blob API** | Generar archivos para descarga |
| **URL.createObjectURL** | Descargar archivos JSON |

### Características de JavaScript
- **ES6 Classes** - Programación orientada a objetos
- **Arrow Functions** - Contexto léxico
- **Map/Set** - Estructuras de datos eficientes
- **Template Literals** - Strings dinámicos
- **Destructuring** - Sintaxis moderna
- **Async/Await** - Operaciones asíncronas (FileReader)

---

## 📂 Estructura del Proyecto

```
SvgRepositoryPrograWeb/
├── index.html              # Estructura HTML principal
├── README.md              # Este archivo
├── css/
│   ├── styles.css         # Estilos principales (variables CSS)
│   └── responsive.css     # Media queries responsive
└── js/
    ├── app.js            # Controlador principal de la aplicación
    ├── flowchart.js      # Lógica del editor (clase FlowchartEditor)
    ├── storage.js        # Gestión de almacenamiento (LocalStorage/SessionStorage)
    └── utils.js          # Utilidades (generación de IDs, modales, etc.)
```

---

### Elementos SVG
Se edito en `flowchart.js`:
- `createStartElement()` - Forma del inicio/fin
- `createProcessElement()` - Forma del proceso
- `createDecisionElement()` - Forma de decisión

---

## 📊 Formato de Datos (JSON)

### Estructura Exportada
```json
{
  "version": "1.0",
  "created": "2024-01-15T10:30:00.000Z",
  "diagram": {
    "elements": {
      "element_abc123": {
        "type": "start",
        "x": 200,
        "y": 100,
        "text": "Inicio del algoritmo"
      },
      "element_def456": {
        "type": "process",
        "x": 200,
        "y": 200,
        "text": "Leer datos"
      },
      "element_ghi789": {
        "type": "decision",
        "x": 200,
        "y": 300,
        "text": "¿Es válido?"
      }
    },
    "connections": {
      "connection_xyz123": {
        "startId": "element_abc123",
        "startPoint": 2,
        "endId": "element_def456",
        "endPoint": 0
      }
    }
  }
}
```



##  Conceptos Puestos en práctica

Este proyecto cubre:

### 1. **Event Listeners DOM**
```javascript
element.addEventListener('pointerdown', handler);
element.addEventListener('dblclick', handler);
document.addEventListener('keydown', handler);
```

### 2. **Web Storage API**
```javascript
localStorage.setItem('key', JSON.stringify(data));
sessionStorage.setItem('key', value);
```

### 3. **SVG Manipulation**
```javascript
document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
element.setAttribute('transform', 'translate(x, y)');
```

### 4. **FileSystem Interaction**
```javascript
const reader = new FileReader();
reader.readAsText(file);
const blob = new Blob([data], {type: 'application/json'});
```

### Tecnologías aplicadas
✅ JavaScript ES6+ (Classes, Modules)
✅ SVG (Scalable Vector Graphics)
✅ Web Storage API
✅ FileReader API
✅ PointerEvents API
✅ CSS Grid/Flexbox
✅ Responsive Design