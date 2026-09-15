# Modderhouse — Web de profesores

Proyecto educativo iniciado y cerrado originalmente en 2023 como entrega de JavaScript. El repositorio conserva esa implementación histórica y, desde 2026, suma una reconstrucción moderna que mantiene el propósito del ejercicio sin presentar el viejo flujo de `localStorage` como autenticación real.

## Estado del repositorio

- **Baseline histórico:** `d6a38f5795569131ff4cd0db63640aff8dc09007` (`Proyecto final`, 2023-02-16).
- **Fuente histórica preservada:** `index.html`, `views/`, `js/`, `json/`, `estilos/` y `assets/` en la raíz.
- **Aplicación 2026:** `modern/`.
- **Carril de modernización:** issue #1.
- **Programa general:** `Enzopinotti/Enzopinotti#19`.

La raíz histórica no se reescribe para aparentar que el proyecto de 2023 utilizaba herramientas actuales.

## Qué hacía la versión 2023

El simulador permitía registrar un supuesto profesor con DNI, correo y contraseña, volver a ingresar comparando esos valores desde `localStorage`, administrar alumnos con nota de 0 a 10, buscar por nombre y mostrar tutores cargados desde un JSON local.

Ese flujo era apropiado como práctica de JavaScript, DOM, arrays, `fetch` y almacenamiento del navegador, pero **no constituye un sistema de autenticación seguro**. La reconstrucción 2026 elimina la recolección de contraseñas y se presenta explícitamente como workspace docente local.

## Reconstrucción 2026

La aplicación moderna usa deliberadamente una arquitectura pequeña:

- Node.js 24;
- pnpm 11.26.0;
- Vite 8;
- TypeScript 6;
- HTML semántico + CSS moderno;
- Vitest + jsdom + Testing Library DOM;
- ESLint 10 + Prettier;
- GitHub Actions para quality y deployment.

No se agregó React, backend, base de datos, OAuth, Docker, CMS ni analytics porque no existe una necesidad real del producto que los justifique.

### Contratos funcionales actuales

- alta de alumnos con nombre, apellido y nota entre 0 y 10;
- prevención explícita de duplicados por identidad normalizada;
- búsqueda tolerante a mayúsculas y acentos;
- eliminación individual;
- limpieza total con confirmación visible;
- persistencia local versionada;
- migración segura de alumnos históricos desde `Alumnos` cuando son válidos;
- eliminación de la vieja clave `Usuarios` para no conservar contraseñas históricas;
- tutores históricos tratados como fixtures de archivo, sin afirmar que sean usuarios actuales;
- ningún dato se envía a un servidor.

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

Incluye formato, documentación, lint, typecheck, tests y build de producción.

## Deployment

El destino previsto es GitHub Pages en:

`https://enzopinotti.github.io/Web-de-profesores/`

Vite usa el base path `/Web-de-profesores/`. La publicación moderna se realiza desde el artefacto generado de `modern/dist`, no desde los archivos históricos de la raíz.

La transición final se considera completa únicamente después de verificar el endpoint público y documentar rollback.

## Documentación

- [`docs/historical-inventory-2026.md`](docs/historical-inventory-2026.md) — inventario y provenance del proyecto 2023.
- [`docs/modernization-2026.md`](docs/modernization-2026.md) — arquitectura, decisiones, seguridad, tests y cutover 2026.

## Principio de preservación

La intención de este repositorio es mostrar evolución técnica real. Por eso el trabajo original permanece auditable, incluidos sus límites. La versión moderna no reemplaza retrospectivamente la historia: la contextualiza y demuestra cómo se resolvería hoy el mismo problema con contratos más seguros, accesibles y verificables.
