# 🎶 ZWING

> DAW colaborativo en tiempo real para crear beats y secuencias de percusión con otros músicos.

---

## 🧮 Tabla de Contenidos

- [Descripción](#descripción)
- [Características](#características)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación y Desarrollo](#instalación-y-desarrollo)
- [Variables de Entorno](#variables-de-entorno)
- [Arquitectura](#arquitectura)
- [Colaboración en Tiempo Real](#colaboración-en-tiempo-real)
- [Motor de Audio](#motor-de-audio)

---

## 📝 Descripción

ZWING es una aplicación web de producción musical colaborativa que permite a múltiples usuarios trabajar simultáneamente en un mismo proyecto de beat. Cuenta con un **channel rack de 16 pasos**, reproducción sincronizada, bloqueo de canales por usuario, biblioteca de sonidos y un sistema de invitaciones para colaboradores.

---

## 🎺 Características

- 🎹 **Channel Rack** — Secuenciador de 16 pasos con hasta N canales de percusión
- 🔴 **Colaboración en tiempo real** — WebSocket (STOMP sobre SockJS) para sincronización instantánea entre usuarios
- 🔒 **Bloqueo de canales** — Sistema de locks para evitar conflictos de edición simultánea
- 🎧 **Motor de audio** — Reproducción vía Web Audio API con carga y caché de buffers
- 🎵 **Biblioteca de sonidos** — Categorizada y con previsualización de samples
- 👥 **Sistema de invitaciones** — Generación de tokens para agregar colaboradores a proyectos
- 📊 **Feed de actividad** — Registro en tiempo real de acciones de cada colaborador
- 🔐 **Autenticación Google** — Login con Google Identity Services

---

## 👩🏼‍💻 Stack Tecnológico

| Categoría | Tecnología |
|-----------|-----------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 8 + Rolldown |
| Estilos | Tailwind CSS 4 + CSS custom (variables DAW) |
| Estado global | Zustand |
| HTTP Client | Axios |
| WebSocket | STOMP.js sobre SockJS |
| Audio | Web Audio API (nativo) + Tone.js |
| Linting | ESLint 9 + typescript-eslint |
| Deploy | Vercel |

---

## 📁 Estructura del Proyecto
src/
├── app/
│   ├── App.tsx               # Enrutamiento interno (login → dashboard → rack)
│   └── routes.tsx            # Tipos de vista
├── features/
│   ├── auth/
│   │   ├── components/       # LoginPage con Google Sign-In
│   │   ├── hooks/            # useGoogleAuth
│   │   └── store/            # authStore (Zustand)
│   ├── channelrack/
│   │   ├── components/       # ChannelRack, Channel, TransportBar, SoundPicker, StepGrid
│   │   ├── hooks/            # useAudioEngine, useRackSocket, useSounds
│   │   ├── store/            # rackStore (Zustand)
│   │   ├── styles/           # daw.css (design system completo)
│   │   └── constants.ts
│   └── projects/
│       ├── components/       # Dashboard
│       └── hooks/            # useProjects
└── shared/
├── api/                  # apiClient (Axios + interceptors)
├── components/           # Icon, Modal
├── websocket/            # stompClient
└── setupGlobal.ts

---

## ⚙️ Instalación y Desarrollo

### 🪈 Prerrequisitos

- Node.js >= 20.19.0
- npm

### 🩴 Pasos

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd enoc-frontend

# 2. Instalar dependencias
npm install

# 3. Crear archivo de variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Correr en desarrollo
npm run dev

# 5. Build para producción
npm run build

# 6. Preview de producción local
npm run preview
```

---

## 🪗 Variables de Entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=http://localhost:8080
```

| Variable | Descripción |
|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | Client ID de Google OAuth 2.0 |
| `VITE_API_BASE_URL` | URL base del backend REST |
| `VITE_WS_BASE_URL` | URL base del servidor WebSocket |

---

### 🖥️ Flujo de navegación

Login (Google OAuth) → Dashboard (listado de los proyectos) → Channel Rack (editor colaborativo)

### 🛝 Gestión de estado

El estado del rack vive principalmente en componentes React via `useState`, sincronizado con el servidor a través de WebSocket. Zustand se usa para estado global de autenticación (`authStore`) y datos del rack (`rackStore`).

### 📞 Comunicación con el backend

- **REST** (`apiClient`): autenticación, proyectos, sonidos, invitaciones
- **WebSocket STOMP**: eventos del rack en tiempo real

#### 🔌 Topics WebSocket

| Destino | Descripción |
|---------|-------------|
| `/topic/rack/{projectId}` | Eventos broadcast del rack |
| `/user/queue/rack/state` | Estado inicial del rack (solo para el usuario) |
| `/user/queue/errors` | Errores del servidor |
| `/app/rack/{projectId}/...` | Comandos enviados al servidor |

---

## 👥⏰ Colaboración en Tiempo Real

Cada acción del usuario genera un comando que el servidor procesa y re-emite como evento al topic del proyecto. Los eventos manejados son:

| Evento | Descripción |
|--------|-------------|
| `RACK_STATE` | Estado completo del rack al conectar |
| `CHANNEL_ADDED` | Nuevo canal agregado |
| `CHANNEL_REMOVED` | Canal eliminado |
| `CHANNEL_LOCKED` | Canal bloqueado por un usuario |
| `CHANNEL_UNLOCKED` | Canal liberado |
| `STEP_TOGGLED` | Paso del secuenciador activado/desactivado |
| `CHANNEL_UPDATED` | Volumen o mute actualizado |
| `BPM_UPDATED` | BPM del proyecto cambiado |
| `PLAYBACK_STARTED` | Reproducción iniciada |
| `PLAYBACK_STOPPED` | Reproducción detenida |

### 🔒 Sistema de locks

Cuando un usuario edita un canal (toggle de paso, eliminación), se adquiere un lock automático. El lock se libera al cabo de 30 segundos de inactividad sobre ese canal. Los canales bloqueados por otro usuario se muestran con una etiqueta "Bloqueado" y sus controles quedan deshabilitados.

---

## 🎚️ Motor de Audio

El audio se maneja íntegramente con la **Web Audio API** a través del hook `useAudioEngine`:

- Los samples se cargan como `AudioBuffer` y se almacenan en caché local.
- El loop de reproducción usa `setInterval` alineado al BPM para disparar los pasos activos.
- El indicador visual de paso corre en paralelo al motor de audio con su propio intervalo.
- La previsualización de sonidos en la biblioteca reproduce el sample completo (máx. 3 s) sin afectar el loop.

BPM 120 → stepDuration = 125 ms (corchea de tresillos, 1/16 de compás)

---

## ⌨️ Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo con HMR
npm run build    # Build de producción (tsc + vite build)
```

---

## 🪁 Deploy

El proyecto está configurado para **Vercel**. El archivo `vercel.json` redirige todas las rutas a `index.html` para soportar el enrutamiento client-side:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```