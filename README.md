# Rat-Ing - Movie Rating Tracker

Una aplicación web para que dos usuarios registren y valoren películas vistas juntos.

## 🚀 Deployment

### Deploy en Vercel (Recomendado)

1. **Fork o clona el repositorio**

2. **Configura las variables de entorno:**
   - Copia `.env.example` a `.env.local`
   - Rellena todas las variables con tus credenciales

3. **Deploy a Vercel:**
   ```bash
   # Opción 1: Desde la terminal
   vercel

   # Opción 2: Desde vercel.com
   # Importa tu repositorio y configura las variables de entorno
   ```

### Variables de Entorno Necesarias

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
TMDB_API_KEY=
NEXT_PUBLIC_ALLOWED_EMAILS=email1@example.com,email2@example.com
```

### Deploy de Firebase

```bash
# Reglas de Firestore
firebase deploy --only firestore:rules

# Índices de Firestore
firebase deploy --only firestore:indexes
```

## 📦 Build Local

```bash
npm install
npm run build
npm run start
```

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth
- **API Externa:** TMDB (The Movie Database)
- **State Management:** TanStack Query (React Query)
- **Hosting:** Vercel

## ✨ Características

- ✅ Búsqueda de películas desde TMDB
- ✅ Sistema de valoraciones individuales (1-10)
- ✅ Comentarios por usuario
- ✅ Historial cronológico
- ✅ Estadísticas y gráficos comparativos
- ✅ Dark mode
- ✅ Responsive design
- ✅ Navegación entre películas
- ✅ Edición de fechas y valoraciones
- ✅ Eliminación de películas

## 📄 Licencia

Este proyecto es privado y de uso personal.