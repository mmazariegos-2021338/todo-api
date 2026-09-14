# Tarea 6 — Implementación de software

Carnet: **25004557**  
Docker Hub: **devmar17**  
Imágenes (nombre obligatorio = carnet, no `todolist` / `todo-api`):

- https://hub.docker.com/r/devmar17/25004557 — tags **`1.0`** y **`2.0`**
- Repositorio: https://github.com/mmazariegos-2021338/todo-api (rama `tarea-6`)

Servidor del docente: `134.209.65.91` (usuario SSH `root`).  
Puerto elegido: **25045** (estaba libre; se deriva del carné). URL: http://134.209.65.91:25045  
No se escribe la contraseña SSH en este repo.

Reporte para entregar: [`reporte-tarea6.pdf`](tarea6/reporte-tarea6.pdf) · [`reporte-tarea6.html`](tarea6/reporte-tarea6.html)

## Evidencias locales (esta máquina)

| Archivo | Qué muestra |
|---------|-------------|
| [`local-v1.png`](local-v1.png) | TodoList v1.0 en `http://127.0.0.1:8080` |
| [`local-v2.png`](local-v2.png) | TodoList v2.0 con filtro y estadísticas |
| [`docker-images.txt`](docker-images.txt) | `devmar17/25004557:1.0` y `:2.0` |
| [`docker-ps-local-v2.txt`](docker-ps-local-v2.txt) | Contenedor `todolist-25004557` |
| [`docker-logs-local-v2.txt`](docker-logs-local-v2.txt) | `TodoList v2.0 escuchando en el puerto 8080` |
| [`docker-hub-tags.txt`](docker-hub-tags.txt) | Tags `1.0` y `2.0` publicadas |
| [`docker-hub-tags.png`](docker-hub-tags.png) | Captura de Docker Hub |
| [`server-v1.png`](server-v1.png) | TodoList v1.0 en el servidor |
| [`server-v2.png`](server-v2.png) | TodoList v2.0 en el servidor (filtro + stats) |
| [`server-despliegue.txt`](server-despliegue.txt) | Comandos Recreate, update y rollback |

## 1. Qué se implementó

TodoList en Node.js + Express + interfaz **React (Vite + TypeScript)**.

| Campo | v1.0 | v2.0 |
|-------|------|------|
| ID, título, descripción, estado, fecha de creación | Sí | Sí |
| Estados PENDIENTE / EN PROGRESO / COMPLETADA | Sí | Sí |
| CRUD (crear, listar, actualizar, eliminar) | Sí | Sí |
| Banner visible | **TodoList v1.0** | **TodoList v2.0** |
| Mejora funcional | — | Filtro por estado + estadísticas |

Configuración por variables de entorno (`PORT`, `APP_VERSION`). No hay credenciales en el código.

## 2. Ejecutar localmente

```bash
npm install
npm install --prefix frontend
npm test
APP_VERSION=1.0 npm start    # API
npm run dev:ui               # React en http://127.0.0.1:5173
# o bien:
npm run build:ui && APP_VERSION=1.0 npm start   # http://127.0.0.1:8080
```

## 3. Construcción y prueba de la imagen

```bash
docker build --build-arg APP_VERSION=1.0 -t devmar17/25004557:1.0 .
docker images | grep 25004557
docker run -d --name todolist-25004557 -p 8080:8080 -e APP_VERSION=1.0 devmar17/25004557:1.0
docker ps
docker logs todolist-25004557
```

Abrir http://127.0.0.1:8080 (usar `127.0.0.1`, no `localhost`, si Colima no publica IPv6).

## 4. Publicación en Docker Hub

```bash
docker login
docker push devmar17/25004557:1.0

docker build --build-arg APP_VERSION=2.0 -t devmar17/25004557:2.0 .
docker push devmar17/25004557:2.0
```

Comprobar en Hub que existen las etiquetas `1.0` y `2.0`.

## 5. Implementación en el servidor (Recreate)

```bash
ssh root@134.209.65.91
docker pull --platform linux/amd64 devmar17/25004557:1.0
docker run -d --name todolist-25004557 -p 25045:8080 --platform linux/amd64 devmar17/25004557:1.0
docker ps
```

Resultado: http://134.209.65.91:25045 muestra **TodoList v1.0**.  
Las imágenes se publicaron para `linux/amd64` porque el servidor no es ARM.

## 6. Tipo de implementación

1. **Tipo:** remota, **manual** y **recreate**. Se construye y prueba en local, se publica en Docker Hub y se despliega por SSH con `docker pull` + `docker run`. No hay pipeline CI/CD que despliegue solo.
2. **Local vs servidor:** en local el puerto es 8080 y el host es la Mac/Colima. En el servidor hay que mapear el puerto asignado, hay latencia de red, hay que autenticarse (SSH) y el contenedor comparte el host con otros equipos. La imagen es la misma; cambia el ambiente.
3. **Riesgos de actualizar producción directo:** downtime (recreate), pérdida de datos en memoria, error humano (`rm` del contenedor equivocado), no hay prueba en el mismo entorno, difícil revertir si no se conservó la imagen anterior.
4. **Ventaja de Docker:** la misma imagen corre igual en laptop y servidor (mismas dependencias, mismo Node, mismo puerto interno). Se mueve software entre ambientes sin “en mi máquina sí corre”.

## 7. Versión 2.0

Mejoras: **filtro por estado** y **estadísticas** (conteo por PENDIENTE / EN PROGRESO / COMPLETADA). El título de la página es **TodoList v2.0**.

```bash
docker build --build-arg APP_VERSION=2.0 -t devmar17/25004557:2.0 .
docker push devmar17/25004557:2.0
```

## 9. Estrategia: Recreate

Se detiene y elimina el contenedor actual y se levanta el nuevo. Es simple y cumple la consigna. El costo es una ventana de indisponibilidad mientras no hay contenedor escuchando.

## 10. Actualización 1.0 → 2.0 y rollback

```bash
# Actualizar
docker stop todolist-25004557
docker rm todolist-25004557
docker pull devmar17/25004557:2.0
docker run -d --name todolist-25004557 -p 25045:8080 --platform linux/amd64 devmar17/25004557:2.0

# Simular problema en v2 y rollback a 1.0
docker stop todolist-25004557
docker rm todolist-25004557
docker run -d --name todolist-25004557 -p 25045:8080 --platform linux/amd64 devmar17/25004557:1.0
```

La imagen `1.0` se deja publicada en Hub para poder volver atrás.

## 11. Buenas prácticas aplicadas

- Tags `1.0` y `2.0`; no se usa solo `latest`.
- Se prueba local (`npm test`, `docker run`) antes de publicar y desplegar.
- `PORT` y `APP_VERSION` salen de variables de entorno.
- La contraseña SSH y tokens de Hub no van en Git ni en este archivo.
- Tras cada `docker run` se revisan `docker ps` y `docker logs`.
- La imagen `1.0` permanece en Hub para rollback.
- Los comandos quedan documentados aquí y en el README.

## 13. Preguntas de análisis

17. **¿Qué es una implementación de software?**  
    Es el proceso de poner una versión del software en un ambiente real (local, pruebas o producción) para que los usuarios o el docente puedan usarla: empaquetar, configurar, desplegar y verificar.

18. **¿Qué diferencia existe entre desarrollo e implementación?**  
    Desarrollo es construir y probar el código. Implementación es instalar/ejecutar esa versión en un ambiente destino (servidor, contenedor, nube) con su configuración y acceso de red.

19. **¿Qué problema resuelve Docker durante una implementación?**  
    Empaqueta la app y sus dependencias en una imagen reproducible. Evita diferencias de “versión de Node / librerías / SO” entre la laptop y el servidor.

20. **¿Por qué debemos versionar una imagen Docker?**  
    Para saber exactamente qué corre en producción, poder publicar `2.0` sin borrar `1.0` y hacer rollback. `latest` no dice qué commit o qué funcionalidad está desplegada.

21. **¿Qué diferencia existe entre integración continua y entrega continua?**  
    CI: cada cambio se integra y se prueba automáticamente (build, tests). CD (entrega continua): cada cambio que pasa CI queda empaquetado y listo para desplegar (imagen versionada), pero el paso a producción puede ser manual.

22. **¿Qué diferencia existe entre entrega continua y despliegue continuo?**  
    Entrega continua deja el artefacto listo; una persona decide cuándo publicarlo. Despliegue continuo lo manda a producción de forma automática si pasa las pruebas.

23. **¿Qué es rollback y por qué es importante?**  
    Volver a una versión anterior que sí funcionaba (aquí: de `2.0` a `1.0`). Reduce el tiempo de falla si la nueva versión tiene un problema.

24. **¿Qué ventajas presenta Blue/Green?**  
    Hay dos ambientes (azul = actual, verde = nueva). Se cambia el tráfico cuando verde está sano. El rollback es volver el tráfico al azul, con poco o nulo downtime.

25. **¿Qué ventajas presenta Canary?**  
    Se expone la nueva versión solo a una fracción de usuarios. Si hay error, el impacto es limitado; se puede ampliar o revertir con evidencia real.

26. **¿Por qué no es recomendable modificar manualmente producción?**  
    No queda registro reproducible, es fácil romper algo irrecuperable, no se puede repetir el mismo cambio en otro ambiente y el rollback se vuelve adivinanza.

27. **¿Qué información debe verificarse después de un despliegue?**  
    Que el contenedor esté `Up` (`docker ps`), que los logs no muestren error (`docker logs`), que `/health` responda, que la UI cargue en `http://IP:PUERTO` y que el CRUD básico funcione.
