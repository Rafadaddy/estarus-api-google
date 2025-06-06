# Sistema de Gestión de Unidades de Autobús

Aplicación web moderna para gestionar el estado de mantenimiento de unidades de autobús con integración a Google Sheets para datos compartidos en tiempo real.

## Características

- ✅ Gestión completa de unidades de autobús
- ✅ Tracking de 9 componentes mecánicos (MOT, TRAN, ELE, A/A, FRE, SUS, DIR, HOJ, TEL)
- ✅ Solo permite eliminación cuando todos los componentes están en estado "listo"
- ✅ Datos compartidos entre usuarios vía Google Sheets
- ✅ Interfaz responsive para móvil y escritorio
- ✅ Exportación a CSV
- ✅ Filtros por estado y componente
- ✅ Estadísticas en tiempo real

## Configuración para GitHub Pages

### 1. Configurar Google Apps Script

1. Ve a [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto
3. Pega el código de `google-apps-script-code.js`
4. Cambia el `SPREADSHEET_ID` por el ID de tu Google Sheet
5. Ve a "Implementar" → "Nueva implementación"
6. Tipo: "Aplicación web"
7. Ejecutar como: "Yo"
8. Acceso: "Cualquier usuario"
9. Copia la URL de implementación

### 2. Configurar Google Sheet

1. Crea una nueva Google Sheet
2. En la primera fila agrega estos encabezados:
   ```
   A1: id
   B1: unitNumber
   C1: MOT
   D1: TRAN
   E1: ELE
   F1: AA
   G1: FRE
   H1: SUS
   I1: DIR
   J1: HOJ
   K1: TEL
   ```
3. Comparte la hoja con permisos de "Editor"

### 3. Configurar Repository en GitHub

1. Haz fork de este repositorio
2. Ve a Settings → Pages
3. Source: "GitHub Actions"
4. Ve a Settings → Secrets and variables → Actions
5. Agrega estos secrets:
   ```
   VITE_GOOGLE_SHEETS_API_KEY: Tu API key de Google Sheets
   VITE_GOOGLE_CLIENT_ID: Tu Client ID de Google (opcional)
   ```

### 4. Actualizar URLs en el código

1. Edita `client/src/lib/googleAppsScript.ts`
2. Cambia `APPS_SCRIPT_URL` por tu URL de Google Apps Script

### 5. Deploy

1. Haz push al branch `main`
2. GitHub Actions construirá y desplegará automáticamente
3. Tu aplicación estará disponible en: `https://tu-usuario.github.io/nombre-repositorio`

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build:static
```

## Estructura del Proyecto

```
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes UI
│   │   ├── lib/           # Utilidades y APIs
│   │   ├── pages/         # Páginas de la aplicación
│   │   └── main.tsx       # Punto de entrada
├── server/                # Backend Express (solo para desarrollo)
├── shared/                # Tipos compartidos
├── .github/workflows/     # GitHub Actions
└── google-apps-script-code.js  # Código para Google Apps Script
```

## APIs Utilizadas

- **Google Sheets API**: Para almacenamiento de datos
- **Google Apps Script**: Como proxy para operaciones de escritura

## Licencia

MIT