# todo-api

API REST de tareas (To-Do) en **Node.js + Express**. Pasa por un flujo DevSecOps básico: pruebas, **SonarQube**, imagen **Docker**, escaneo **Trivy** y publicación en **Docker Hub**.

**Tarea Unidad 4 — Trivy, Sonar, Docker** (individual). La IA se usó como apoyo; el código y las evidencias se revisaron y se pueden explicar.

## Entregables de la consigna

| Pedido de la tarea | Dónde está en este proyecto |
|--------------------|-----------------------------|
| URL del repositorio | https://github.com/mmazariegos-2021338/todo-api |
| README (local + Docker) | Secciones 2 y 3 |
| Dockerfile y `.dockerignore` | Raíz del proyecto |
| Evidencia Sonar (captura o enlace + resultado) | [`docs/sonar-evidencia.md`](docs/sonar-evidencia.md): [proyectos](docs/sonar-projects.png), [dashboard](docs/sonar-dashboard.png), [issues](docs/sonar-issues.png). Quality Gate Passed, 0 issues, cobertura 80.6% |
| Evidencia Trivy | Sección 5, `trivy-report-before.txt`, `trivy-report-after.txt` |
| Docker Hub + etiqueta de versión | https://hub.docker.com/r/devmar17/todo-api — tag **`1.0`** |
| 3 a 5 prompts de IA y qué aportaron | Sección 7 |
| Reflexión final (5–8 líneas) | Sección 8 |

## Requisitos obligatorios (qué se hizo)

| Herramienta | Qué pide la tarea | Evidencia real |
|-------------|-------------------|----------------|
| IA | Apoyo para diseñar, programar, corregir o documentar | 5 prompts en la sección 7. Decisión técnica: ver “Para la defensa” |
| SonarQube | Analizar bugs, vulnerabilidades y code smells | Análisis local Community 26.8, project key `todo-api`. **0 / 0 / 0**. No se inventaron correcciones en `src/` |
| Docker | Imagen funcional | `docker build -t devmar17/todo-api:1.0 .` y `docker run --rm -p 8080:8080 devmar17/todo-api:1.0`. `/health` y CRUD verificados |
| Trivy | Escanear la imagen | Antes: 2 HIGH Alpine + 1 CRITICAL / 10 HIGH en npm de la imagen. Después: **0 CRITICAL, 0 HIGH** |
| Docker Hub | Publicar con etiqueta de versión | https://hub.docker.com/r/devmar17/todo-api tag `1.0` |

## Flujo de trabajo (pasos 1–10)

1. Idea: API REST To-Do (crear, listar, actualizar, eliminar) + `/health`.
2. IA para estructura y Dockerfile; el código se revisó y se probaron 8 tests.
3. Prueba local: `npm install`, `npm test` (8/8), `npm start` en el puerto 8080.
4. SonarQube local (`docker-compose.sonar.yml`), proyecto `todo-api`.
5. Hallazgos Sonar: **ninguno relevante**. Documentado; no se fabricaron 2 fixes.
6. Imagen construida y contenedor iniciado; `curl` a `/health` y `/tasks` OK.
7. Trivy contra `devmar17/todo-api:1.0` (salida en `trivy-report-before.txt`).
8. HIGH/CRITICAL fáciles: `apk upgrade` (openssl 3.5.8) y se quitó npm/yarn del runtime. Rescan: `trivy-report-after.txt` en 0.
9. `docker push devmar17/todo-api:1.0`.
10. Evidencias en este README, `docs/` y los reportes Trivy.

## Criterios de evaluación (100 pts)

| Criterio | Pts | Cómo se cubre |
|----------|-----|----------------|
| Aplicación funcional | 25 | 6 rutas reales (CRUD + health). Corre local y en contenedor |
| Calidad con Sonar | 20 | Análisis ejecutado, interpretado y documentado (0 hallazgos; no se corrigió código inventado) |
| Docker | 15 | Dockerfile + `.dockerignore` + comando de ejecución; contenedor funcional |
| Seguridad con Trivy | 20 | Escaneo antes/después, interpretación y corrección de HIGH/CRITICAL |
| Docker Hub | 10 | Imagen pública `devmar17/todo-api:1.0` |
| IA y documentación | 10 | Prompts, decisión explicada y reflexión |

## Condiciones de aceptación

- La aplicación inicia: `npm start` o `docker run --rm -p 8080:8080 devmar17/todo-api:1.0`.
- El análisis de Sonar corresponde a este código (`src/`, key `todo-api`).
- El reporte Trivy es de la misma imagen publicada (`devmar17/todo-api:1.0`).
- La imagen está en Docker Hub para la revisión.

### Para la defensa

Hay que poder explicar el flujo y **al menos una decisión técnica con IA**.

Trivy marcó openssl HIGH (`CVE-2026-14456`) y `tar` CRITICAL (`CVE-2026-59873`). La IA ayudó a separar: openssl se parchea con `apk upgrade` en Alpine; `tar` no era de Express, sino del npm que trae `node:22-alpine`. Como el contenedor solo ejecuta `node src/server.js`, se eliminó npm/yarn/corepack del runtime. El rescan quedó en 0 CRITICAL/HIGH. En Sonar no había issues: no se tocó `src/` para fingir correcciones.

Pull de la imagen publicada:

```bash
docker pull devmar17/todo-api:1.0
docker run --rm -p 8080:8080 devmar17/todo-api:1.0
```

## 1. Funcionalidades

API REST de tareas con operaciones CRUD completas:

| Método | Ruta          | Descripción                                  |
|--------|---------------|-----------------------------------------------|
| GET    | `/health`     | Verifica que el servicio está vivo             |
| GET    | `/tasks`      | Lista todas las tareas                         |
| GET    | `/tasks/:id`  | Obtiene una tarea por id                       |
| POST   | `/tasks`      | Crea una tarea (`title` requerido, `description` opcional) |
| PUT    | `/tasks/:id`  | Actualiza título, descripción y/o `completed`  |
| DELETE | `/tasks/:id`  | Elimina una tarea                              |

El almacenamiento es en memoria (se reinicia al reiniciar el proceso); es suficiente para esta actividad, que se enfoca en el flujo de calidad/seguridad, no en persistencia.

## 2. Ejecutar localmente (sin Docker)

Requiere Node.js 20+.

```bash
npm install
npm test          # corre la suite de pruebas (jest + supertest) con cobertura
npm start         # levanta el servidor en http://localhost:8080
```

Prueba rápida:

```bash
curl http://localhost:8080/health
curl -X POST http://localhost:8080/tasks -H "Content-Type: application/json" -d '{"title":"Comprar leche"}'
curl http://localhost:8080/tasks
```

## 3. Ejecutar con Docker

```bash
docker build -t devmar17/todo-api:1.0 .
docker run --rm -p 8080:8080 devmar17/todo-api:1.0
```

Verificar que el contenedor responde:

```bash
curl http://localhost:8080/health
```

Notas de diseño del `Dockerfile`:
- Imagen base `node:22-alpine` (ligera, menor superficie de vulnerabilidades que `node:22` completo).
- Solo se instalan dependencias de producción (`npm install --omit=dev`), sin `eslint`/`jest`/`supertest` dentro de la imagen.
- El contenedor corre con el usuario `node` (no root) por buenas prácticas de seguridad.
- Incluye `HEALTHCHECK` usando el propio endpoint `/health`.
- `.dockerignore` excluye `node_modules`, tests, `.git`, cobertura, etc. para una imagen más pequeña y una build más rápida.

## 4. Análisis de calidad con SonarQube (local)

Se usa SonarQube Community en un contenedor local, así no necesitas crear ninguna cuenta.

```bash
docker compose -f docker-compose.sonar.yml up -d
```

Espera 1-2 minutos a que arranque y entra a http://localhost:9000 (usuario `admin`, clave `admin`; te pedirá cambiarla en el primer ingreso).

1. Crea un proyecto manual (Local project) con la key `todo-api` y genera un **token**.
2. Genera el reporte de cobertura antes de analizar:
   ```bash
   npm test
   ```
3. Corre el analizador (no necesitas instalar nada más, se usa vía Docker):
   ```bash
   docker run --rm \
     -e SONAR_HOST_URL="http://host.docker.internal:9000" \
     -e SONAR_TOKEN="<pega_aqui_tu_token>" \
     -v "$(pwd):/usr/src" \
     sonarsource/sonar-scanner-cli
   ```
   (En Linux, cambia `host.docker.internal` por la IP del host o agrega `--add-host=host.docker.internal:host-gateway`).
4. Entra al dashboard del proyecto en SonarQube y revisa los hallazgos (bugs, vulnerabilidades, code smells).

### Evidencia del análisis de Sonar

Dashboard local: `http://127.0.0.1:9000/dashboard?id=todo-api` (tras el análisis del 2026-09-01, API `api/issues/search` + `api/measures/component`).

- Bugs encontrados: **0**
- Vulnerabilidades encontradas: **0**
- Code smells encontrados: **0**
- Security hotspots: **0**
- Cobertura reportada por Sonar: **80.6%** (111 ncloc)
- Hallazgos corregidos: **ninguno**. El Quality Profile "Sonar way" no reportó issues en `src/`. No se inventaron correcciones de código.
- Capturas: [lista de proyectos](docs/sonar-projects.png), [dashboard](docs/sonar-dashboard.png) e [Issues vacías](docs/sonar-issues.png).

Para detener SonarQube cuando termines:

```bash
docker compose -f docker-compose.sonar.yml down
```

## 5. Escaneo de seguridad con Trivy

Sin necesidad de instalar Trivy localmente, usando su imagen oficial:

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image devmar17/todo-api:1.0
```

Para guardar la salida como evidencia:

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image devmar17/todo-api:1.0 | tee trivy-report.txt
```

Si aparecen vulnerabilidades **HIGH** o **CRITICAL** en la imagen base que se puedan resolver fácilmente (por ejemplo, actualizando la etiqueta de `node:22-alpine` a un parche más reciente, o cambiando a una imagen `-slim`/`-alpine` más nueva), actualiza el `Dockerfile`, reconstruye la imagen y vuelve a escanear:

```bash
docker build -t devmar17/todo-api:1.0 .
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image devmar17/todo-api:1.0
```

### Evidencia del escaneo de Trivy

Salidas reales: `trivy-report-before.txt` (primer escaneo) y `trivy-report-after.txt` (tras corregir el Dockerfile).

**Antes (imagen `node:22-alpine` sin parches extra):**
- Alpine 3.24.1: **20** vulns (**0 CRITICAL, 2 HIGH**, 6 MEDIUM, 12 LOW). Los 2 HIGH son `libcrypto3`/`libssl3` **CVE-2026-14456** (openssl 3.5.7-r0, fix 3.5.8-r0).
- Paquetes Node de la imagen (npm/yarn embebidos, no de la API): **18** vulns (**1 CRITICAL, 10 HIGH**, 7 MEDIUM). CRITICAL: `tar` **CVE-2026-59873**. HIGH: `brace-expansion`, `ip-address`, `pacote`, `picomatch`, `sigstore`, `tar`. Las dependencias de Express en `/usr/src/app/node_modules` estaban en **0**.

**Después (reconstrucción):**
- Alpine: **0** vulnerabilidades
- node-pkg: **0** vulnerabilidades
- CRITICAL: **0** / HIGH: **0**

**Corrección aplicada:**
1. `RUN apk upgrade --no-cache` — subió openssl `3.5.7-r0` → `3.5.8-r0` (elimina los 2 HIGH de Alpine y el resto de CVEs de libssl/libcrypto).
2. Tras `npm install --omit=dev`, se eliminan `/usr/local/lib/node_modules/npm`, `corepack` y `/opt/yarn*` porque el contenedor solo ejecuta `node src/server.js`. Eso quitó el CRITICAL/HIGH del npm embebido, no de nuestro código.

## 6. Publicar en Docker Hub

```bash
docker login
docker push devmar17/todo-api:1.0
```

URL pública de la imagen: https://hub.docker.com/r/devmar17/todo-api (tag `1.0`, digest `sha256:d4201b24a662d4cf03c498bae685204c441c3d91e6f819b3b59803f40dbbce46`).

## 7. Uso de Inteligencia Artificial (registro de prompts)

Se usó Claude como copiloto para diseñar la estructura del proyecto, generar el código base y explicar los hallazgos de Sonar/Trivy. Todo el código generado fue revisado y probado (`npm test`, ejecución manual de la API) antes de incorporarse.

| # | Prompt utilizado | Qué aportó la IA |
|---|-------------------|-------------------|
| 1 | "Ayúdame a crear una API REST sencilla de tareas en Node.js con Express. Debe tener crear, listar, actualizar y eliminar. Explícame la estructura antes de generar código." | Propuso separar el almacenamiento (`taskStore.js`) de las rutas (`app.js`) y el arranque del servidor (`server.js`), lo cual facilita las pruebas unitarias. |
| 2 | "Genera un Dockerfile sencillo y seguro para esta aplicación Node.js. Explícame cada instrucción." | Sugirió usar `node:22-alpine`, copiar primero `package*.json` para aprovechar cache de capas, instalar solo dependencias de producción y correr como usuario no root (`USER node`). |
| 3 | "Revisa este código y dime qué problemas de calidad podría detectar Sonar antes de correr el análisis." | Señaló puntos a vigilar: manejo de errores en rutas, validación de entrada del `title`, y la necesidad de pruebas para elevar la cobertura. |
| 4 | "Trivy reporta CVE-2026-14456 (openssl HIGH) y CVE-2026-59873 (tar CRITICAL). ¿Qué riesgo tienen y cómo corregirlas sin tocar la API?" | Confirmar que el HIGH era el openssl de Alpine (parche `apk upgrade`) y el CRITICAL estaba en el npm embebido de la imagen, no en Express; se eliminó npm/yarn del runtime. |
| 5 | "Revisa mi README y dime si otra persona podría ejecutar la aplicación siguiendo únicamente esas instrucciones." | Ayudó a reorganizar el README en secciones claras (local, Docker, Sonar, Trivy, Docker Hub) y a agregar comandos de verificación (`curl`). |

## 8. Reflexión final

SonarQube Community (26.8) no encontró bugs, vulnerabilidades ni code smells en los 111 ncloc; la cobertura quedó en 80.6%. No había issues reales que corregir en `src/`, y forzar cambios solo para “cumplir dos hallazgos” habría sido inventar evidencia. Trivy sí encontró problemas, todos heredados: 2 HIGH de openssl en Alpine (`CVE-2026-14456`, 3.5.7-r0) y 1 CRITICAL + 10 HIGH en el npm/yarn que trae `node:22-alpine`, no en Express. Un `docker pull` de la misma etiqueta no bastó (mismo digest); el parche fácil fue `apk upgrade` (openssl 3.5.8-r0) y quitar npm/yarn del runtime, porque el `CMD` solo corre `node`. El rescan quedó en 0 CRITICAL y 0 HIGH. En la práctica también falló levantar Sonar en Colima con 2 GiB (ElasticSearch exit 137) y `host.docker.internal` no alcanzó al contenedor: hizo falta 6 GiB y analizar por la red de Compose. Eso confirma que el flujo DevSecOps no es solo “pasar tests”: hay que medir, distinguir hallazgo de la app vs. de la imagen, y documentar lo que no aplica.

## 9. Estructura del proyecto

```
todo-api/
├── src/
│   ├── app.js          # rutas Express (endpoints CRUD)
│   ├── server.js       # arranque del servidor HTTP
│   ├── taskStore.js     # almacenamiento en memoria
│   └── app.test.js      # pruebas (jest + supertest)
├── Dockerfile
├── .dockerignore
├── docker-compose.sonar.yml
├── sonar-project.properties
├── package.json
├── README.md
├── docs/sonar-evidencia.md
├── docs/sonar-projects.png
├── docs/sonar-dashboard.png
├── docs/sonar-issues.png
├── trivy-report-before.txt
└── trivy-report-after.txt
```
