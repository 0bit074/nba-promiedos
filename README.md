# NBA Promiedos

App web responsive de la NBA: marcadores en vivo, fixture, posiciones, jugadores y un minijuego de predicciones.

Hecha con Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4 y TypeScript.

## Cómo ejecutarla

```bash
npm install
npm run dev
```

La app queda en <http://localhost:3000>.

## Fuente de datos

Por defecto usa la API pública no oficial de ESPN, que no necesita clave pero tampoco tiene garantías de disponibilidad.

Para trabajar con datos de prueba que cubren todos los estados de un partido, crea un archivo `.env.local`:

```bash
NBA_DATA_SOURCE=mock
```

La caché no distingue entre fuentes: al cambiarla, borra la carpeta `.next` y reinicia el servidor.

Para sumar otra API, implementa la interfaz `NbaDataProvider` de `src/lib/nba/types.ts` y selecciónala en `src/lib/nba/index.ts`. La UI solo depende de los tipos de dominio, así que no hay que cambiarla.

## PWA

La app se puede instalar en el celular o la PC. El service worker solo se registra en producción, así que para probarlo hay que usar `npm run build` y `npm run start`.

Sin conexión, las páginas muestran `public/offline.html`: los marcadores nunca se sirven desde la caché para no mostrar resultados viejos.

Para cambiar los iconos, edita y ejecuta `scripts/generate-icons.mjs`.

## Estructura

```text
src/
├── app/                 Rutas: partidos (/), posiciones, equipos, jugadores y pickem
├── components/
│   ├── games/           Cartelera: tarjetas, selector de fechas y actualización en vivo
│   ├── layout/          Header y navegación (PC y mobile)
│   ├── players/         Buscador, líderes y ficha de jugador
│   ├── pwa/             Service worker y aviso de sin conexión
│   ├── standings/       Tablas de posiciones por conferencia
│   ├── teams/           Plantel de cada equipo
│   └── ui/              Componentes genéricos
└── lib/
    ├── dates.ts         Jornadas NBA y formato de fechas
    └── nba/             Tipos de dominio y proveedores de datos (ESPN y mock)
```
