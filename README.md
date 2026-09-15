# Modderhouse — Web de profesores

Proyecto educativo iniciado y cerrado originalmente en 2023 como entrega de JavaScript. El repositorio conserva esa implementación histórica y, desde 2026, suma una reconstrucción moderna y una fase posterior de maduración que mantiene el propósito del ejercicio sin presentar el viejo flujo de `localStorage` como autenticación real.

La intención no es borrar el proyecto viejo ni reemplazarlo retroactivamente. **Las dos versiones conviven como etapas distintas del mismo aprendizaje.**

## Dos versiones, dos responsabilidades

### 2023 — entrega histórica

Baseline exacto:

`d6a38f5795569131ff4cd0db63640aff8dc09007` (`Proyecto final`, 2023-02-16)

Después del cutover de Pages, la copia explícita de esa entrega vive en:

`historical/2023/`

Sus 14 archivos se recrean directamente desde el commit histórico y el quality recalcula sus Git blob SHA-1 para exigir coincidencia byte-for-byte con el baseline original.

La historia Git sigue siendo la autoridad primaria. No se reescribe la versión 2023 para aparentar que entonces usaba herramientas, prácticas o decisiones que todavía no formaban parte del proyecto.

> Importante: la versión 2023 conserva el comportamiento educativo original que almacenaba DNI/email/contraseña en `localStorage`. No representa autenticación segura y no debe usarse con datos reales.

### 2026 — reconstrucción y maduración

La fuente mantenida vive en `modern/`. Su objetivo no es “sumar tecnologías”, sino resolver mejor los problemas reales del ejercicio original: seguridad conceptual, reglas de dominio, accesibilidad, recuperación de datos, edición, operaciones reversibles, lectura útil del grupo, tests y deployment reproducible.

Carriles de trabajo:

- **#1 — modernización 2026:** preservación, reconstrucción, CI y deployment;
- **#5 — maduración 2026:** convertir el simulador reconstruido en una herramienta docente local pequeña pero confiable;
- **programa general:** `Enzopinotti/Enzopinotti#19`.

## Qué hacía la versión 2023

El simulador permitía registrar un supuesto profesor con DNI, correo y contraseña, volver a ingresar comparando esos valores desde `localStorage`, administrar alumnos con nota de 0 a 10, buscar por nombre y mostrar tutores cargados desde un JSON local.

Ese flujo era apropiado como práctica de JavaScript, DOM, arrays, `fetch` y almacenamiento del navegador, pero **no constituye un sistema de autenticación seguro**.

La versión 2026 elimina la recolección de contraseñas y se presenta explícitamente como workspace docente local.

## Arquitectura 2026

La aplicación moderna usa deliberadamente una arquitectura pequeña:

- Node.js 24;
- pnpm 11.26.0;
- Vite 8;
- TypeScript 6;
- HTML semántico + CSS moderno;
- Vitest + jsdom + Testing Library DOM;
- ESLint 10 + Prettier;
- GitHub Actions para quality y deployment.

No se agregó React, backend, base de datos, OAuth, Docker, CMS ni analytics porque ninguna de esas piezas resuelve por sí sola una limitación actual del producto.

## Qué significa “madurar” este proyecto

La fase 2026 no se mide por cantidad de dependencias. Se mide por reducción de riesgo y fricción.

### Datos locales confiables

- persistencia local versionada;
- migración segura de alumnos históricos desde `Alumnos` cuando son válidos;
- eliminación de la vieja clave `Usuarios` para no conservar contraseñas históricas;
- detección explícita de store corrupto, versión incompatible o schema inválido;
- un store no legible **no se sobrescribe ni se presenta como si estuviera vacío**;
- posibilidad de descargar el payload original antes de descartarlo;
- backup JSON versionado;
- restauración atómica;
- modos explícitos `reemplazar` y `combinar`;
- merge con deduplicación y detección de conflictos de ID;
- ningún dato se envía a un servidor.

### Operación cotidiana

- alta de alumnos con nombre, apellido y nota entre 0 y 10;
- edición conservando el ID estable;
- prevención de duplicados también durante edición;
- cancelación de edición sin mutar persistencia;
- búsqueda tolerante a mayúsculas y acentos;
- orden por apellido/nombre o por nota ascendente/descendente;
- eliminación individual;
- vaciado total con confirmación visible;
- `Deshacer` de la última operación destructiva mediante snapshot en memoria;
- `Deshacer` de una restauración de backup durante la sesión.

### Lectura docente neutral

El workspace muestra:

- cantidad de alumnos;
- promedio;
- nota mínima;
- nota máxima.

No clasifica automáticamente “aprobado/desaprobado” porque el proyecto histórico nunca definió un umbral y ese criterio depende del contexto académico.

### Historia visible

La versión 2026 enlaza al commit histórico exacto de 2023. Los tutores históricos se mantienen como fixtures de archivo y no se presentan como cuentas o roles actuales.

## Seguridad y privacidad

La versión moderna mantiene límites deliberados:

- no recopila contraseñas;
- no finge autenticación;
- no envía datos a terceros;
- no usa analytics;
- no requiere secretos;
- un archivo importado se trata como entrada no confiable y se valida antes de modificar el store;
- los cambios de recuperación son explícitos y atómicos.

## Desarrollo local

```bash
nvm use
cd modern
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Contrato completo de calidad:

```bash
pnpm check
```

Incluye formato, documentación, lint, typecheck, tests, build de producción, paridad del mirror de Pages y verificación byte-for-byte del archivo 2023.

## Deployment

Producción:

`https://enzopinotti.github.io/Web-de-profesores/`

`modern/` es la fuente de producto. Vite genera `modern/dist` con base `/Web-de-profesores/`.

GitHub Pages seguía teniendo una publicación legacy desde `main` además del workflow custom. En vez de depender de cuál deploy termina último, el repositorio mantiene una **paridad de autoridades**:

- el workflow custom publica `modern/dist`;
- la raíz contiene un mirror generado del mismo `dist` (`index.html`, `robots.txt`, `sitemap.xml`, `.nojekyll` y `assets/index-*.{js,css}`);
- `pnpm pages:mirror:check` exige igualdad byte-for-byte entre ambos;
- la versión 2023 está aislada en `historical/2023/` y ya no necesita ocupar la entrada de producción.

Así, mientras GitHub mantenga cualquiera de los dos mecanismos de Pages, ambos deben resolver la misma aplicación 2026 en la URL principal.

## Documentación

- [`historical/README.md`](historical/README.md) — autoridad y límites de la copia histórica exacta;
- [`docs/version-map.md`](docs/version-map.md) — mapa explícito de las autoridades histórica 2023 y mantenida 2026;
- [`docs/historical-inventory-2026.md`](docs/historical-inventory-2026.md) — inventario y provenance del proyecto 2023;
- [`docs/modernization-2026.md`](docs/modernization-2026.md) — arquitectura, seguridad, tests y reconstrucción 2026;
- [`docs/maturity-2026.md`](docs/maturity-2026.md) — criterios de maduración, continuidad de datos y decisiones de producto;
- [`docs/deployment-cutover-2026.md`](docs/deployment-cutover-2026.md) — deployment, smoke, autoridad y rollback.

## Principio de preservación

Este repositorio quiere mostrar evolución real, no borrar etapas anteriores. El código original permanece auditable con sus aciertos y limitaciones en el commit histórico y en `historical/2023/`. La versión 2026 demuestra cómo resolver hoy el mismo problema con mejores contratos y mejor operación, sin atribuirle retrospectivamente esas decisiones al proyecto de 2023.
