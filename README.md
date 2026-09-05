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

| Pieza | Elección |
| --- | --- |
| Rutas | `react-router-dom` v7 |
| Formularios | `react-hook-form` + `zod` |
| HTTP | Cliente `fetch` propio (`src/shared/api/`) |
| Tests | Vitest + React Testing Library + MSW |

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
| `yarn test` | Ejecuta los tests una vez |
| `yarn test:watch` | Tests en modo vigilancia |

## Rutas

| Ruta | Página | Spec |
| --- | --- | --- |
| `/` | Estado de la conexión con la API | — |
| `/register` | Formulario de alta | `registro.md` escenarios 1-7 |
| `/check-your-email` | Pantalla de espera tras el `202`, con reenvío | `registro.md` escenario 11 |
| `/verify-email?token=…` | Consume el token del enlace del correo | `registro.md` escenarios 8-10 |

`/login` todavía no existe: llega con `specs/login.md`. Los enlaces que apuntan
a ella caen de momento en la página de "no existe".

## Estructura

El código se organiza **por funcionalidad**, no por capa técnica:

```
src/
├── api/                        # Clientes HTTP del andamiaje
├── features/auth/
│   ├── api/authApi.ts          # register, verifyEmail, resendVerification
│   ├── components/             # RegisterForm, PasswordField, ResendVerification
│   ├── pages/                  # RegisterPage, CheckYourEmailPage, VerifyEmailPage
│   └── schemas/                # Reglas zod, compartidas con los tests
├── shared/api/                 # httpClient, ApiError (RFC 7807), mensajes por code
├── pages/StatusPage.tsx
├── test/                       # Arnés de MSW y utilidades de render
└── App.tsx                     # Rutas
```

## Decisiones que conviene no deshacer

- **El access token vivirá solo en memoria**, nunca en `localStorage` ni en
  `sessionStorage`. Lo mismo vale para el token de verificación: se lee del
  query string, se envía y se olvida.
- **La interfaz enruta por el `code` del error, nunca por su `detail`.** Los
  mensajes en español están en un único mapa (`shared/api/errorMessages.ts`);
  el texto que manda el servidor no se muestra tal cual.
- **`CheckYourEmailPage` no puede afirmar que la cuenta se haya creado.** El
  registro responde `202` exista o no el email, a propósito, y decirlo
  delataría justo lo que la respuesta se calla. Hay un test que lo vigila.
- **El medidor de fuerza de la contraseña es orientativo.** La lista de
  contraseñas comunes vive en el backend y no se duplica aquí: añadiría 100 KB
  de descarga a cada visita.

## Estado actual

- ✅ Registro y verificación de email (`specs/registro.md`), contra la API que
  fija `specs/api-contract.md` §2.6-2.8.
- ⬜ Login, sesiones y rutas protegidas (`specs/login.md`).

Los tests corren contra MSW, así que **no hace falta el backend** para
ejecutarlos. Para probar el flujo a mano sí: la API todavía no expone
`/api/v1/auth/*`.

## Convenciones

- Código en **inglés**; documentación y textos de interfaz en **español**.
- Comentarios solo donde la lógica no sea obvia.
- Un test por cada criterio de aceptación de la spec.
