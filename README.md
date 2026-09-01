
Separar el modelo del controlador (y ambos de Express) permite probar la lógica
de negocio sin levantar un servidor HTTP real — así se logró **100% de cobertura**
en modelo y controlador (ver sección 4).

## 2. Endpoints

| Método | Ruta               | Descripción                              |
|--------|---------------------|-------------------------------------------|
| POST   | `/api/tasks`         | Crear una tarea                          |
| GET    | `/api/tasks`         | Listar todas las tareas                  |
| GET    | `/api/tasks/:id`      | Obtener una tarea por id                 |
| PUT    | `/api/tasks/:id`      | Actualizar una tarea (título/desc/estado)|
| DELETE | `/api/tasks/:id`      | Eliminar una tarea                       |
| GET    | `/health`             | Healthcheck (usado por Docker)           |
| GET    | `/api-docs`           | Documentación interactiva Swagger        |

Base de datos: SQLite en memoria por defecto (los datos se pierden al reiniciar,
igual que el H2 mostrado en clase). Para persistirla en disco, define
`DB_PATH=/ruta/al/archivo.db` como variable de entorno.

## 3. Ejecutar localmente (sin Docker)

Requisitos: **Node.js 22.13 o superior** (usa el módulo nativo `node:sqlite`, que
ya no requiere flags experimentales desde esa versión).

```bash
npm install
npm start
# API en http://localhost:8080
# Swagger UI en http://localhost:8080/api-docs
```

Probar rápido:
```bash
curl -X POST http://localhost:8080/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"Mi primera tarea\"}"
curl http://localhost:8080/api/tasks
```

## 4. Pruebas y cobertura (para Sonar)

Este proyecto usa el **test runner nativo de Node** (`node:test`), sin
dependencias externas de testing.

```bash
# Correr las pruebas
npm test

# Correr las pruebas y generar coverage/lcov.info (lo que Sonar necesita leer)
npm run test:coverage
```

Resultado actual: 21 pruebas, **100% de cobertura de líneas** en `src/models` y
`src/controllers` (muy por encima del 80% que exige el Quality Gate de Sonar).

## 5. Análisis de calidad con SonarQube / SonarCloud

Se usó **SonarCloud**, conectado directamente al repositorio de GitHub (análisis
automático en cada push, sin necesidad de correr el scanner manualmente).

El primer análisis detectó **4 hallazgos de seguridad (Medium)** en el `Dockerfile`,
todos relacionados con el uso de `npm install`:
- *"Using dependencies without locking resolved versions is security-sensitive"*
- *"Omitting '--ignore-scripts' allows lifecycle scripts to run during package installation"*

Se corrigieron los 4 cambiando `npm install` por `npm ci --ignore-scripts` en las
dos etapas del `Dockerfile` (usa exactamente las versiones fijadas en
`package-lock.json` y bloquea la ejecución de scripts arbitrarios durante la
instalación). Tras el fix se hizo `git push`, lo que disparó un nuevo análisis
automático.

Evidencia (enlace del análisis):
> https://sonarcloud.io/project/overview?id=Elmer-Fuentes_actividad-unidad4-todo-api-docker

## 6. Construir la imagen Docker

```bash
docker build -t usuario/todo-api:1.0 .
docker run --rm -p 8080:8080 usuario/todo-api:1.0
curl http://localhost:8080/health
```

## 7. Escaneo de seguridad con Trivy

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy image usuario/todo-api:1.0
```

**Resultado antes de corregir:**
- Alpine (SO): 20 vulnerabilidades (2 HIGH, 6 MEDIUM, 12 LOW) — `libssl3`/`libcrypto3`
  desactualizados (OpenSSL).
- Node.js (node-pkg): 18 vulnerabilidades (10 HIGH, 1 CRITICAL, 7 MEDIUM) — todas
  en el CLI de `npm` empaquetado dentro de la imagen base (`tar`, `pacote`,
  `sigstore`, `ip-address`, `picomatch`), no en las dependencias propias del
  proyecto (Express, Swagger salieron con 0 vulnerabilidades).

**Corrección aplicada:**
1. `apk update && apk upgrade` en el Dockerfile para actualizar OpenSSL a la
   versión con el fix.
2. Eliminación del CLI de `npm` de la imagen final (`rm -rf /usr/local/lib/node_modules/npm ...`),
   ya que en producción se arranca con `node src/server.js`, no con `npm start`,
   así que no se necesita dentro del contenedor.

**Resultado después de corregir:**
- Alpine: **0 vulnerabilidades**.
- Node.js (node-pkg): **0 vulnerabilidades**.

## 8. Publicar en Docker Hub

```bash
docker login
docker build -t usuario/todo-api:1.0 .
docker push usuario/todo-api:1.0
```

URL pública de la imagen:
> https://hub.docker.com/r/elmerfuentes/todo-api

## 9. Registro de prompts utilizados con IA

| # | Prompt utilizado | Qué aportó la IA |
|---|-------------------|--------------------|
| 1 | "Ayúdame a crear una API REST de tareas en Node.js/Express, organizada en capas (modelo/controlador/rutas), con una base de datos embebida." | Propuso separar modelo, controlador y rutas, y sugirió `node:sqlite` como base de datos embebida sin dependencias externas; se revisó cada capa y se ajustó la validación de `title`. |
| 2 | "Agrega documentación Swagger/OpenAPI a los endpoints con swagger-jsdoc y swagger-ui-express." | Generó las anotaciones `@openapi` por endpoint y el montaje de `/api-docs`; se verificó que los schemas coincidieran con las respuestas reales del controlador. |
| 3 | "¿Cómo genero un reporte de cobertura en formato lcov con el test runner nativo de Node para que Sonar lo pueda leer?" | Explicó las flags `--experimental-test-coverage --test-reporter=lcov`; se probó el comando y se confirmó 100% de cobertura en modelo y controlador antes de incluirlo. |
| 4 | "Trivy me marca vulnerabilidades HIGH/CRITICAL en tar, pacote y sigstore, pero mi proyecto no usa esas librerías directamente, ¿por qué?" | Explicó que esos paquetes pertenecen al CLI de `npm` empaquetado dentro de la imagen base de Node, no a las dependencias del proyecto, y propuso eliminar el CLI de `npm` de la imagen final ya que no se usa en producción. |
| 5 | "Sonar marca 'using dependencies without locking resolved versions' y 'omitting --ignore-scripts' en mi Dockerfile, ¿cómo lo corrijo?" | Explicó la diferencia entre `npm install` y `npm ci`, y recomendó agregar la bandera `--ignore-scripts` para evitar la ejecución de scripts arbitrarios durante la instalación de dependencias. |

## 10. Reflexión final

> Durante esta actividad, uno de los principales problemas que encontré fue que, al
> construir la imagen Docker, Trivy detectó vulnerabilidades HIGH y CRITICAL que no
> venían de mi código ni de mis dependencias (Express, Swagger), sino del propio CLI
> de npm empaquetado dentro de la imagen base de Node. Corregí esto actualizando los
> paquetes del sistema operativo (Alpine/OpenSSL) con `apk upgrade` y eliminando el
> CLI de npm de la imagen final, ya que en producción no se necesita. También
> configuré SonarCloud y corregí los hallazgos que marcó en el Dockerfile, cambiando
> `npm install` por `npm ci --ignore-scripts`, lo que asegura versiones exactas de
> las dependencias y evita que se ejecuten scripts arbitrarios durante la
> instalación. Aprendí que la seguridad en un flujo DevSecOps no depende solo de
> escribir buen código, sino también de revisar la imagen base y sus componentes, y
> que herramientas como Sonar y Trivy permiten detectar y corregir estos problemas
> antes de publicar en producción. En general, entendí que este proceso es
> iterativo: se construye, se escanea, se corrige y se vuelve a escanear.