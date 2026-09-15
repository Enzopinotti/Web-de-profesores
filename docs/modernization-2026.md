# Modernización Modderhouse 2026

## Objetivo

Reconstruir el simulador docente de 2023 como una aplicación local, segura en sus límites, accesible, testeable y desplegable sin inventar un backend ni borrar la evidencia histórica.

## Decisión de arquitectura

Se eligió **Vite + TypeScript + HTML semántico + CSS moderno**.

React fue evaluado y descartado para esta fase porque la aplicación tiene una sola superficie operativa, estado local acotado y ningún requisito de composición que justifique sumar un runtime de componentes. La decisión busca demostrar criterio de arquitectura y no acumulación de herramientas.

## Estructura

```text
historical root (2023, immutable by convention)
        ↓ provenance
modern/src/domain
        ↓
modern/src/storage
        ↓
modern/src/app.ts
        ↓
modern/index.html + styles
        ↓
modern/dist
        ↓
GitHub Pages
```

## Seguridad y privacidad

### Credenciales históricas

La versión moderna no muestra campos de DNI/email/password para autenticación y no intenta validar identidad.

Al iniciar:

1. elimina la clave histórica `Usuarios` de `localStorage` cuando existe;
2. nunca copia esa información a la nueva estructura;
3. no envía datos a servidores.

Esto es relevante porque `localStorage` está asociado al origen y puede sobrevivir a un cutover aunque cambie la aplicación servida.

### Datos de alumnos

Los alumnos sí son parte central del ejercicio y pueden migrarse desde la clave histórica `Alumnos` cuando cada registro cumple el contrato moderno.

La nueva persistencia utiliza un envelope versionado bajo `modderhouse.students.v1`. Datos corruptos o incompatibles no rompen la aplicación.

### XSS

Los valores introducidos por el usuario se insertan mediante `textContent`; no se interpolan dentro de HTML dinámico.

## Contrato de dominio

### Student

```text
id: string
name: string
surname: string
grade: number (0..10)
```

Reglas:

- nombre y apellido obligatorios, normalizados y acotados;
- nota numérica finita dentro de 0–10;
- duplicado = mismo nombre + apellido después de normalizar mayúsculas, espacios y diacríticos;
- búsqueda usa la misma normalización;
- orden visible por apellido y nombre.

### Tutor

Los tutores provienen del JSON histórico. En 2026 son **fixtures de archivo**, no cuentas actuales ni afirmaciones laborales.

Las fotografías originales quedan preservadas pero no se descargan en la UI moderna para evitar transferir más de 15 MB de media histórica innecesaria.

## UX y accesibilidad

- skip link;
- landmarks semánticos;
- labels visibles;
- errores por campo mediante `aria-describedby` y `aria-invalid`;
- región `aria-live` para resultados de acciones;
- botones explícitos por alumno;
- confirmación de limpieza sin `window.confirm` bloqueante;
- empty state y search-empty state distintos;
- responsive layout sin ancho fijo del viewport;
- `prefers-reduced-motion` respetado.

## Metadata

Autoridad prevista:

`https://enzopinotti.github.io/Web-de-profesores/`

El documento incluye canonical y Open Graph básicos. `robots.txt` y `sitemap.xml` usan la misma autoridad.

GitHub Pages no permite el mismo control de headers HTTP que un host configurable. Por eso el documento usa una CSP meta conservadora como defensa adicional, dejando explícito que no equivale a un header CSP completo.

## Toolchain

Se reutiliza la compatibilidad ya validada en `El_Nucleo_Web` donde aplica:

- Node 24;
- pnpm 11.26.0;
- Vite 8.3;
- TypeScript 6.0;
- Vitest 5;
- ESLint 10;
- Prettier 3.9.

La política de pnpm añade edad mínima de paquetes y bloquea subdependencias exóticas.

## Quality contract

`pnpm check` ejecuta, en orden:

1. Prettier del workspace;
2. Prettier de README/docs del repositorio;
3. ESLint con cero warnings;
4. TypeScript sin emit;
5. Vitest;
6. build Vite de producción.

El CI permanente usa instalación congelada y permisos de solo lectura.

## Deployment

Vite configura:

```text
base = /Web-de-profesores/
```

porque el destino es una GitHub project page. El deployment final utilizará un workflow de Pages que publique únicamente `modern/dist`.

Si Pages continúa configurado para publicar desde una branch, GitHub Settings → Pages deberá cambiarse a **GitHub Actions** antes del cutover. Esta configuración administrativa no se considera realizada hasta poder verificarla.

## Rollback

El baseline histórico permanece disponible en Git como:

`d6a38f5795569131ff4cd0db63640aff8dc09007`

El cambio de Pages no elimina esa fuente. Si el artefacto moderno falla, puede restaurarse la fuente de publicación histórica mientras se investiga.

## Cierre del carril

El issue #1 sólo puede cerrarse cuando:

- quality está verde en `main`;
- Pages sirve el artefacto moderno;
- canonical/base/assets funcionan en la URL real;
- el smoke público confirma que no existe un formulario de contraseña;
- la documentación registra la evidencia final;
- el roadmap central `Enzopinotti/Enzopinotti` se actualiza a `completed`.
