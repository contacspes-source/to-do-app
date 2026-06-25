# Mi semestre — App

Organizador personal de Jorge: **académico + Finanzas + MealPrep**, en una sola app.
Antes era un archivo HTML gigante; ahora es un proyecto **TypeScript + Vite** modular,
limpio y escalable, conservando tus datos (mismo `localStorage` y mismo Supabase).

## Cómo correrla en tu compu

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:5173
```

Para generar la versión de producción:

```bash
npm run build    # genera /dist listo para publicar
npm run preview  # previsualiza el /dist
```

## Cómo desplegarla (Cloudflare Pages)

El despliegue cambió de "subir un archivo" a "build de un proyecto":

1. Sube esta carpeta a tu repo de GitHub.
2. En Cloudflare Pages:
   - **Root directory:** `Proyectos/App-Mi-Semestre`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Cada push reconstruye y publica solo.

(La carpeta `dist/` incluida es un build de ejemplo; se regenera con `npm run build`.)

## Arquitectura (dónde está cada cosa)

```
index.html              Shell de la app (markup estático + modales)
src/
├─ main.ts              Punto de entrada: inicializa todo y arranca
├─ router.ts            Navegación entre pantallas + tema
├─ config/             Constantes (app.ts) y credenciales Supabase (supabase.ts)
├─ types/              Tipos TypeScript de todos los modelos de datos
├─ database/           Persistencia y datos
│  ├─ store.ts         Estado central (DB), guardado y migraciones
│  ├─ client.ts        Cliente Supabase
│  ├─ schema.sql       Estructura de la base en la nube (tabla app_state + RLS)
│  ├─ seed.ts          Datos de ejemplo del primer arranque
│  ├─ academic-data.ts Datos del plan académico (materias, horarios, áreas)
│  └─ recipes.ts       Banco de recetas de MealPrep
├─ services/           Lógica de aplicación
│  ├─ sync.ts          Autenticación + sincronización en la nube
│  └─ mealplan.ts      Generador de plan semanal + lista de súper + metas
├─ finance/            Funciones financieras
│  ├─ cards.ts         Tarjetas: pago, simulador, personalización
│  └─ calc.ts          Totales, proyección, alertas
├─ hooks/              Lógica reutilizable
│  └─ useSegment.ts    Manejo de barras de pestañas (Hoy/Plan/Dinero/Comida)
├─ components/         Componentes de UI compartidos
│  └─ modals.ts        Todos los modales (tarjeta, pago, compra→finanzas, etc.)
├─ pages/              Una pantalla = un archivo
│  ├─ hoy.ts  tarea-nueva.ts  tarea-detalle.ts
│  ├─ plan.ts  constancia.ts  dinero.ts  comida.ts  ajustes.ts
├─ utils/              Utilidades (format.ts, dom.ts)
├─ styles/             CSS por capas (tokens, base, nav, components)
└─ assets/             Imágenes/íconos (vacío por ahora)
```

Regla simple: **un archivo por responsabilidad**. Si buscas Finanzas → `finance/`
y `pages/dinero.ts`; MealPrep → `database/recipes.ts`, `services/mealplan.ts` y
`pages/comida.ts`; sincronización → `services/sync.ts`.

## Base de datos

Supabase, tabla `app_state` (un JSON por usuario, protegido con RLS).
El esquema está en `src/database/schema.sql`.
