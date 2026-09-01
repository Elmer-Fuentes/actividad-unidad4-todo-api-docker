# To-Do API — Actividad Unidad IV (Trivy, Sonar, Docker)

API REST de tareas (To-Do) construida en **Node.js + Express**, organizada en capas
(config / modelo / controlador / rutas), con **base de datos SQLite embebida**
(`node:sqlite`, equivalente en espíritu al H2 en memoria usado en clase) y
**documentación Swagger/OpenAPI**. Sigue el flujo DevSecOps de la Unidad IV:
código → pruebas con cobertura → análisis con Sonar → imagen Docker → escaneo con
Trivy → publicación en Docker Hub.

## 1. Arquitectura del proyecto

```
src/
  config/database.js      -> conexión SQLite y creación de la tabla
  models/taskModel.js     -> acceso a datos (CRUD sobre la tabla tasks)
  controllers/taskController.js -> lógica de request/response
  routes/taskRoutes.js    -> rutas Express + anotaciones OpenAPI
  docs/swagger.js         -> configuración de swagger-jsdoc
  middleware/errorHandler.js
  app.js                  -> ensambla la app Express (factory)
  server.js               -> punto de entrada, levanta el servidor
test/
  taskModel.test.js       -> pruebas unitarias del modelo (capa de datos)
  taskController.test.js  -> pruebas unitarias del controlador
```

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

Puedes usar SonarQube local (como en la demo de clase) o SonarCloud.

**Opción A: SonarQube local con Docker (igual que en clase)**
```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:community
# Espera a que levante, entra a http://localhost:9000 (admin/admin la primera vez)
# Genera un token en Mi cuenta > Seguridad
```

**Opción B: SonarCloud (gratis, sin instalar nada)**
Crea cuenta en https://sonarcloud.io, conecta el repositorio y genera un token.

**Ejecutar el análisis** (ya generado `coverage/lcov.info` con el paso anterior):
```bash
npm run test:coverage

docker run --rm \
  -e SONAR_TOKEN=TU_TOKEN \
  -e SONAR_HOST_URL=http://localhost:9000 \
  -v "$(pwd):/usr/src" \
  sonarsource/sonar-scanner-cli
```
(Si usas SonarCloud, agrega `sonar.organization=TU_ORG` en `sonar-project.properties`
y usa `SONAR_HOST_URL=https://sonarcloud.io`.)

Revisa los hallazgos en el dashboard. Corrige al menos 2 (o documenta que no hubo
hallazgos relevantes) y vuelve a escanear.

Evidencia (captura o enlace del análisis):
> _(pendiente: pegar captura o URL del proyecto en Sonar)_

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

Documenta aquí el resultado (resumen de vulnerabilidades por severidad):
> _(pendiente: pegar salida o captura de `trivy image usuario/todo-api:1.0`)_

Si aparecen vulnerabilidades **HIGH** o **CRITICAL** fáciles de corregir (por
ejemplo, actualizando `node:22-alpine` a un patch más reciente en el Dockerfile),
corrígelas y vuelve a escanear antes de publicar.

## 8. Publicar en Docker Hub

```bash
docker login
docker tag usuario/todo-api:1.0 usuario/todo-api:1.0
docker push usuario/todo-api:1.0
```

URL pública de la imagen:
> _(pendiente: pegar la URL de Docker Hub, ej. https://hub.docker.com/r/usuario/todo-api)_

## 9. Registro de prompts utilizados con IA

| # | Prompt utilizado | Qué aportó la IA |
|---|-------------------|--------------------|
| 1 | "Ayúdame a crear una API REST de tareas en Node.js/Express, organizada en capas (modelo/controlador/rutas), con una base de datos embebida." | Propuso separar modelo, controlador y rutas, y sugirió `node:sqlite` como base de datos embebida sin dependencias externas; se revisó cada capa y se ajustó la validación de `title`. |
| 2 | "Agrega documentación Swagger/OpenAPI a los endpoints con swagger-jsdoc y swagger-ui-express." | Generó las anotaciones `@openapi` por endpoint y el montaje de `/api-docs`; se verificó que los schemas coincidieran con las respuestas reales del controlador. |
| 3 | "¿Cómo genero un reporte de cobertura en formato lcov con el test runner nativo de Node para que Sonar lo pueda leer?" | Explicó las flags `--experimental-test-coverage --test-reporter=lcov`; se probó el comando y se confirmó 100% de cobertura en modelo y controlador antes de incluirlo. |
| 4 | _(agregar el prompt real que usaste al interpretar los hallazgos de Sonar/Trivy)_ | _(completar tras ejecutar el análisis)_ |
| 5 | _(agregar si usaste un quinto prompt)_ | _(completar)_ |

## 10. Reflexión final (completar, 5 a 8 líneas)

> _(pendiente: escribe aquí qué problema encontraste, qué corregiste con Sonar/Trivy
> y qué aprendiste del flujo DevSecOps — tu reflexión personal, no copiada de la IA)._
