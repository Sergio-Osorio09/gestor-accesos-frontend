# gestor-accesos · frontend

SPA en React + TypeScript del módulo de seguridad y autenticación de un
marketplace.

> **Repositorio independiente.** Las especificaciones viven en
> [`gestor-accesos`](https://github.com/Sergio-Osorio09/gestor-accesos), y son
> la fuente de verdad: antes de tocar código, lee `specs/api-contract.md` y la
> spec de la funcionalidad en curso.
>
> Para trabajar en local, clona este repo **dentro** de la carpeta de specs con
> el nombre `frontend/`. Las instrucciones completas están en el README de ese
> repositorio.

## Stack

React 19 · TypeScript · Vite 8 · Yarn 4 (vía corepack)

## Requisitos

Node.js ≥ 20. Yarn no se instala aparte:

```bash
corepack enable
```

## Arrancar

```bash
yarn install
yarn dev
```

Abre <http://localhost:5173>.

El servidor de desarrollo hace de **proxy de `/api` hacia
`http://localhost:8080`** (ver `vite.config.ts`), así que el navegador ve un
único origen y no hace falta configurar CORS. Levanta el backend en paralelo o
la página mostrará la API como no disponible.

## Comandos

| Comando | Qué hace |
| --- | --- |
| `yarn dev` | Servidor de desarrollo con recarga en caliente |
| `yarn build` | Comprueba tipos (`tsc -b`) y compila a `dist/` |
| `yarn preview` | Sirve el resultado de `build` |
| `yarn lint` | Linter (oxlint) |

## Estructura

```
src/
├── api/          # Clientes HTTP, uno por área del contrato
├── App.tsx       # Página de estado del andamiaje
└── main.tsx
```

Cuando se implemente el login, el código se organizará **por funcionalidad**
(`src/features/auth/…`), no por capa técnica.

## Estado actual

Andamiaje: la app arranca y comprueba la conexión con la API contra
`/api/v1/status`. **Sin lógica de negocio todavía.**

Las dos funcionalidades especificadas en el repo de specs siguen sin
implementar: `specs/registro.md` (alta de cuentas y verificación de email) y
`specs/login.md` (autenticación y sesiones). El registro va primero, porque el
login asume cuentas que ya existen.

## Convenciones

- Código en **inglés**; documentación y textos de interfaz en **español**.
- Comentarios solo donde la lógica no sea obvia.
- Un test por cada criterio de aceptación de la spec.
