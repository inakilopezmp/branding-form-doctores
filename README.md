## +Pacientes – Formulario Diseño Gráfico

Aplicación web (Next.js) para que médicos completen un formulario y obtengan, de forma automática:

- Identidad visual básica (logos imagotipo + isotipo)
- Tarjeta de presentación profesional
- Receta médica personalizable

El flujo está optimizado para que el médico solo tenga que llenar un formulario y luego confirmar/ajustar detalles en una pantalla de resumen.

---

## Stack tecnológico

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript + React 18
- **Estilos**: Tailwind CSS 4
- **Backend / APIs**: Rutas `app/api/*` de Next.js
- **IA de imágenes**: Google Gemini / Imagen (`@google/genai`)
- **Almacenamiento / BBDD**: Supabase (`@supabase/supabase-js`)
- **PDF / generación de archivos**: `puppeteer`, `html2canvas`, `jspdf`, `jszip`
- **QR**: `qrcode`, `qr-code-styling`

---

## Arquitectura general

Estructura principal de la carpeta `app`:

- `app/page.tsx`  
  Formulario principal donde el médico introduce sus datos, preferencias de logo, tarjeta y receta.

- `app/confirmar/page.tsx`  
  Pantalla de **confirmación** con:
  - Vista de estado de generación de logos (mensajes progresivos + barra de carga).
  - Selector de logo (grid de vistas previas).
  - Vista previa de tarjeta (anverso/reverso).
  - Vista previa de receta.
  - Botones para descargar PDFs / ZIPs.

- `app/preview/tarjeta/[formId]/page.tsx`  
- `app/preview/receta/[formId]/page.tsx`  
  Rutas de **preview** de tarjeta y receta a partir de un `formId` guardado.

- `app/layout.tsx`  
  Layout raíz de la App Router (fuentes, fondo, estructura general).

- `app/api/*` (rutas de backend):
  - `api/submit/route.ts`: guarda los datos del formulario en Supabase (tabla `branding_forms`) y devuelve `formId`.
  - `api/form-data/route.ts`: recupera los datos de un formulario por `formId`.
  - `api/generate-logos/route.ts`: genera variantes de logos con Gemini y guarda las URLs en Supabase.
  - `api/logos/route.ts`: devuelve las URLs de logos para un `formId` (usado para **polling** en la pantalla de confirmar).
  - `api/select-logo/route.ts`: guarda cuál logo imagotipo/isotipo fue seleccionado.
  - `api/tarjeta-pdf/route.ts`: genera el PDF/ZIP de la tarjeta.
  - `api/receta-pdf/route.ts`: genera el PDF de la receta.
  - `api/list-models/route.ts`: utilidades para listar modelos de IA disponibles (debug / ajustes).

Componentes y utilidades:

- `components/StyledQR.tsx`: generación de códigos QR estilizados.
- `lib/colors.ts`: parseo del color de acento, descripción semántica y normalización de colores para los prompts de IA y estilos.

---

## Flujo funcional principal

### 1. Llenado de formulario inicial

1. El usuario completa datos personales (nombre, título, especialidad, subespecialidad, clínica, etc.).
2. Define preferencias de logo:
   - Tipo de logo: iniciales, nombre completo, nombre de clínica.
   - Estilo: moderno, minimalista, elegante, médico clásico…
   - Colores preferidos / colores que no le gustan.
   - Símbolos deseados (ej: corazón, estetoscopio, etc.).
3. Activa/desactiva elementos de tarjeta y receta (teléfono, WhatsApp, dirección, redes, QR, etc.).
4. Al enviar, se llama a `POST /api/submit` y se redirige a `/confirmar?formId=...`.

### 2. Pantalla de confirmar (`/confirmar`)

La ruta `app/confirmar/page.tsx`:

- Lee `formId` y datos de la query (`nombre`, `titulo`, etc.).
- Muestra mensajes de progreso y animación mientras se generan logos.
- Hace **polling** periódico a `GET /api/logos?formId=...` hasta que haya suficientes URLs de logos.

#### Selector de logos

- Los logos se generan en pares:  
  `[isotipo1, imagotipo1, isotipo2, imagotipo2, ...]`.
- En la UI se muestran los **imagotipos** en un grid:
  - Hasta 4 logos: `grid-cols-2`.
  - Más de 4 logos: `grid-cols-4`.
  - Cada celda es un cuadrado (`aspect-square`) con el logo centrado (`object-contain`).
- Al hacer clic en un logo:
  - Se marca como seleccionado.
  - El isotipo correspondiente se usa para tarjeta/receta.

#### “Generar nuevos logos” y preferencias del usuario

Cuando ya hay logos generados:

- Se muestra el botón **“Generar nuevos logos”**.
- Al hacer clic:
  - El botón se esconde.
  - Aparece un campo de texto:
    - Label: **“¿Cómo te gustaría que fueran los nuevos logos? (opcional)”**
    - Placeholder: ejemplos de cambios (más minimalista, con corazón, colores suaves, etc.).
  - Debajo, un botón **“Generar”** y un enlace **“Cancelar”**.

Al pulsar **“Generar”**:

1. Se vuelve a pedir el `form` a `GET /api/form-data?formId=...`.
2. Se llama a `POST /api/generate-logos` con:
   - `formId`
   - `form`
   - `append: true` (añadir nuevas variantes sin sobrescribir las anteriores)
   - `preferenciasNuevosLogos: string | undefined` con el texto del usuario.
3. Se reactiva el **polling** de logos hasta que existan las nuevas variantes.

La preferencia escrita por el usuario se inyecta en los prompts de IA tanto para:

- Nuevos **imagotipos** (texto pasado como `userHint` a `buildLogoPromptForVariant`).
- Nuevos **isotipos** generados a partir de la imagen del imagotipo, extendiendo el prompt base `ISOTIPO_FROM_IMAGE_PROMPT`.

---

## Generación de logos (API `app/api/generate-logos/route.ts`)

Puntos clave de la implementación:

- Usa `@google/genai` con el modelo por defecto:
  - `DEFAULT_IMAGEN_MODEL = "gemini-2.5-flash-image"`.
  - Soporta también Imagen 4 (`imagen-4.0-generate-001`, etc.) si se configura.
- Usa Supabase:
  - **Bucket**: `logos` (público).
  - **Tabla**: `branding_forms` con columna `logo_urls` (`text[]` o `jsonb`).

Pasos:

1. Lee de Supabase los `logo_urls` existentes de ese `formId`.
2. Si ya hay suficientes logos y no se forzó `force`, evita generar duplicados.
3. Calcula `baseIndex` para que nuevos lotes no sobrescriban imágenes previas (`append`).
4. Genera primero **4 imagotipos** en paralelo:
   - Prompt construido por `buildLogoPromptForVariant(form, "imagotipo", variationHint, userHint)`.
   - Se añaden variaciones predefinidas para `append` (`APPEND_VARIATION_HINTS`).
5. A partir de las imágenes de imagotipos, genera **4 isotipos**:
   - Usa el prompt `ISOTIPO_FROM_IMAGE_PROMPT` + posibles preferencias del usuario.
6. Sube todas las imágenes a Supabase Storage y actualiza `logo_urls`.

La función `buildLogoPromptForVariant`:

- Integra:
  - Nombre profesional (`Dr. Nombre Apellido`).
  - Especialidad y subespecialidad.
  - Nombre de clínica si aplica.
  - Tipo de logo, estilo, color de acento y símbolos deseados.
- Aplica reglas estrictas:
  - Un solo logo por imagen.
  - Sin palabras genéricas (solo nombre real y especialidad).
  - Fondo blanco / transparente, sin 3D, sin sombras complejas.
- En modo isotipo, solo símbolo, sin texto.
- En modo imagotipo, estructura `símbolo + nombre + especialidad`.

---

## Generación de PDFs

### Tarjeta (`app/api/tarjeta-pdf/route.ts`)

- Recibe el `formId` y los datos necesarios para renderizar la tarjeta.
- Usa una combinación de:
  - HTML/CSS (mismo diseño que la vista previa).
  - `puppeteer` / `html2canvas` / `jspdf` para:
    - Renderizar anverso/reverso.
    - Exportar a PDF o ZIP listo para impresión.

### Receta (`app/api/receta-pdf/route.ts`)

- Recibe también `formId` y datos de receta.
- Genera un PDF con:
  - Logo seleccionado.
  - Datos del médico (nombre, especialidad, cédulas, teléfono, dirección).
  - Campos personalizables adicionales.
  - Opciones de tamaño: `media_carta`, `carta`, `a5`.
  - Opción de marca de agua.

---

## Variables de entorno

Crear un archivo `.env.local` en la raíz con, al menos:

- `GEMINI_API_KEY`  
  API key de Google AI Studio (`https://aistudio.google.com/apikey`).

- `SUPABASE_URL`  
  URL del proyecto Supabase.  
  Si no se define, se usa el valor fijo `SUPABASE_BASE` en `generate-logos` (actualmente `yohtffzgmwtuxvnqwgyu.supabase.co`).

- `SUPABASE_API_KEY`  
  Clave de servicio de Supabase (con permisos para leer/escribir en `branding_forms` y `logos`).

Variables opcionales:

- `IMAGEN_MODEL`  
  Modelo de imágenes a usar. Ejemplos:
  - `"gemini-2.5-flash-image"` (por defecto)
  - `"imagen-4.0-generate-001"`

- `LOGO_GEN_DELAY_MS`  
  Milisegundos de pausa entre fases de generación de logos (por defecto `6000`).

- `LOGO_GEN_CONCURRENCY`  
  Máximo de imágenes generadas en paralelo por lote (por defecto `2`).

---

## Scripts de desarrollo

Desde la raíz del proyecto:

- **Desarrollo**:

  ```bash
  npm install
  npm run dev
  ```

  La app se levanta por defecto en `http://localhost:3000`.

- **Build producción**:

  ```bash
  npm run build
  npm start
  ```

- **Lint**:

  ```bash
  npm run lint
  ```

---

## Notas y decisiones clave

- Los logos se almacenan siempre en Supabase Storage bajo la carpeta del `formId`, con índices coherentes para isotipo/imagotipo.
- El selector de logos en `/confirmar` está pensado para ser muy claro visualmente:
  - Grid responsive con 2 o 4 columnas.
  - Celdas cuadradas para que todas las miniaturas se vean consistentes.
  - Enfoque en la selección rápida de un solo logo preferido.
- La acción **“Generar nuevos logos”** nunca destruye los anteriores: siempre **anexa** nuevas variantes para evitar perder propuestas útiles.
- Las preferencias de usuario para nuevas generaciones se propagan tanto a imagotipos como a isotipos, con campos explícitos en los prompts de IA.

Si en el futuro se añaden nuevos flujos (ej. más plantillas de tarjeta/receta o más variantes de logo), este README se puede ampliar en la sección de **Arquitectura general** y **Flujo funcional principal**.

