# Archivo histórico 2023

`historical/2023/` es una copia byte-for-byte de la entrega original de Modderhouse del commit:

`d6a38f5795569131ff4cd0db63640aff8dc09007` — `Proyecto final` (2023-02-16).

Su función es preservar y hacer auditable la primera versión después de que la raíz del repositorio pasó a actuar como mirror de publicación de la versión 2026.

## Autoridad

- **Historia original:** el commit `d6a38f57…` sigue siendo la autoridad histórica primaria.
- **Copia navegable:** `historical/2023/` conserva exactamente los mismos blobs y estructura relativa.
- **Producto mantenido:** `modern/` es la única fuente de producto 2026 que debe evolucionar.
- **Raíz del repositorio:** `index.html`, `robots.txt`, `sitemap.xml`, `.nojekyll` y `assets/index-*.{js,css}` son un mirror generado del build moderno para neutralizar la publicación legacy de GitHub Pages.

## Seguridad

La versión 2023 se preserva como evidencia educativa. Incluye el comportamiento histórico que trataba DNI/email/contraseña en `localStorage`; eso **no es autenticación segura** y no debe usarse con datos reales.

La aplicación 2026 no hereda ese modelo: no recopila contraseñas ni presenta cuentas ficticias como autenticación.

## Invariante permanente

`pnpm pages:mirror:check` recalcula el Git blob SHA-1 de los 14 archivos del archivo 2023 y exige que coincidan con los blobs del baseline original. Si uno cambia, el quality falla.
