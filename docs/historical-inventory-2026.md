# Inventario histórico 2023

## Autoridad de referencia

La reconstrucción parte del commit histórico:

`d6a38f5795569131ff4cd0db63640aff8dc09007`

Fecha: 2023-02-16. Mensaje: `Proyecto final`.

No se modifican sus archivos para hacerlos parecer contemporáneos.

## Superficies históricas

### `index.html`

Pantalla de entrada de **Modderhouse** con dos formularios:

1. ingreso de profesor mediante DNI + contraseña;
2. registro mediante DNI + email + contraseña.

La navegación exitosa dirige a `views/principal.html`.

### `views/principal.html`

Workspace docente con:

- nombre del alumno;
- apellido;
- nota con rango HTML 0–10;
- alta de alumno;
- eliminación del último alumno;
- búsqueda por nombre;
- lista de tutores;
- listado lateral de alumnos.

### `js/main.js`

Implementa la clase `Usuario` y persiste objetos con DNI, correo y contraseña bajo la clave `Usuarios` de `localStorage`. El ingreso compara DNI/contraseña íntegramente del lado cliente.

Este comportamiento se conserva como evidencia histórica pero queda **fuera de la autoridad moderna**.

### `js/principal.js`

Implementa la clase `Alumno`, lectura/escritura de `localStorage`, render imperativo, prevención parcial de duplicados, búsqueda por nombre y carga de tutores mediante `fetch("/json/tutores.json")`.

La ruta absoluta del JSON es además un riesgo para project pages servidas bajo un subpath.

### `json/tutores.json`

Fixtures históricos:

- María Elena Martinez;
- Enzo Daniel Pinotti;
- Martin Moreno;
- Fernanda Lorena Ortiz.

Las imágenes originales permanecen en `assets/imagenesTutores/`.

## Assets y costo de transferencia

Entre los originales existe una fotografía de tutor de aproximadamente 11 MB y un fondo de hormigón de aproximadamente 4,3 MB. No se borran ni reemplazan porque forman parte de la entrega histórica.

La aplicación 2026 evita descargarlos por defecto: representa tutores con avatares tipográficos y recrea la referencia visual gris/hormigón mediante CSS. De esta manera la historia permanece disponible sin trasladar esa deuda de rendimiento a producción.

## Límites históricos identificados

- contraseñas en texto plano dentro de `localStorage`;
- formularios GET para datos con apariencia de credenciales;
- ausencia de backend/auth real;
- elementos HTML no estándar;
- estilos inline y atributos `class` duplicados;
- accesibilidad y estados de error limitados;
- render con `innerHTML` para algunos datos;
- rutas absolutas incompatibles con ciertos subpaths;
- sin runtime/package manager reproducible;
- sin lint, tests, typecheck, build ni CI.

Estos puntos describen el proyecto de aprendizaje original; no se usan para desvalorizarlo ni se ocultan durante la modernización.
