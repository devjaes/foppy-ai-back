# Dockerización de Fopymes Backend

Este documento explica cómo ejecutar la aplicación Fopymes Backend utilizando Docker.

## Requisitos previos

- Docker
- Docker Compose

## Estructura de la dockerización

La aplicación ha sido dockerizada utilizando un enfoque multi-etapa:

1. **Dockerfile**: Contiene la configuración para construir la imagen Docker de la aplicación.
   - Etapa de construcción (`builder`): Instala dependencias y prepara el código.
   - Etapa de producción (`production`): Crea una imagen más ligera con solo lo necesario para ejecutar la aplicación.
   - Script de entrada (`docker-entrypoint.sh`): Ejecuta automáticamente las migraciones de la base de datos antes de iniciar la aplicación.

2. **docker-compose.yaml**: Orquesta los servicios necesarios:
   - `app`: El servicio de la aplicación backend.
   - `db`: Base de datos PostgreSQL.

3. **Configuración de entorno**:
   - `.env.docker`: Variables de entorno específicas para el entorno Docker.

## Cómo ejecutar la aplicación

### 1. Preparación

Asegúrate de que el archivo `.env.docker` esté configurado correctamente con las credenciales de la base de datos y otras configuraciones necesarias.

### 2. Construir y ejecutar los contenedores

```bash
docker-compose up --build
```

Este comando construirá las imágenes necesarias y ejecutará los contenedores. La primera vez que se ejecute, tomará más tiempo mientras se descargan las imágenes base y se instalan las dependencias.

**Nota**: Al iniciar los contenedores, el script de entrada `docker-entrypoint.sh` se ejecutará automáticamente y realizará las siguientes acciones:
1. Esperar a que la base de datos esté lista
2. Ejecutar las migraciones de la base de datos (`bun drizzle-kit generate` y `bun drizzle-kit migrate`)
3. Iniciar la aplicación

Para ejecutar los contenedores en segundo plano (modo detached):

```bash
docker-compose up -d
```

### 3. Verificar que los contenedores estén funcionando

```bash
docker-compose ps
```

### 4. Acceder a la aplicación

La aplicación estará disponible en: `http://localhost:3005`

## Comandos útiles

### Ver logs de los contenedores

```bash
# Ver logs de todos los servicios
docker-compose logs

# Ver logs de un servicio específico
docker-compose logs app
docker-compose logs db

# Ver logs en tiempo real
docker-compose logs -f
```

### Detener los contenedores

```bash
docker-compose down
```

Para detener los contenedores y eliminar los volúmenes (esto eliminará los datos de la base de datos):

```bash
docker-compose down -v
```

### Ejecutar comandos dentro del contenedor

```bash
docker-compose exec app /bin/sh
```

## Solución de problemas

### Problemas de conexión a la base de datos

Si la aplicación no puede conectarse a la base de datos, verifica:

1. Que las variables de entorno en `.env.docker` sean correctas.
2. Que el servicio de base de datos esté funcionando: `docker-compose ps db`
3. Los logs de la base de datos: `docker-compose logs db`

### Problemas con los permisos de archivos

Si hay problemas con los permisos de archivos dentro del contenedor, puede ser necesario ajustar los permisos en el Dockerfile o en los volúmenes montados.

## Desarrollo con Docker

Para desarrollo, el contenedor monta el directorio actual como un volumen, lo que permite ver los cambios en tiempo real sin necesidad de reconstruir la imagen.
