#!/bin/sh
set -e

# Esperar a que la base de datos esté lista
echo "Esperando a que la base de datos esté lista..."

# Función para verificar la conexión a la base de datos
check_db() {
  echo "Intentando conectar a la base de datos..."
  # Usar variables de entorno para la conexión
  pg_isready -h db -p 5432 -U "$DATABASE_USERNAME" > /dev/null 2>&1
  return $?
}

# Esperar hasta que la base de datos esté disponible
COUNTER=0
MAX_TRIES=30
until check_db || [ $COUNTER -eq $MAX_TRIES ]; do
  echo "Esperando a que la base de datos esté disponible... ($COUNTER/$MAX_TRIES)"
  sleep 2
  COUNTER=$((COUNTER+1))
done

if [ $COUNTER -eq $MAX_TRIES ]; then
  echo "Error: No se pudo conectar a la base de datos después de $MAX_TRIES intentos."
  echo "Verificando credenciales y configuración:"
  echo "DATABASE_URL: $DATABASE_URL"
  echo "DATABASE_USERNAME: $DATABASE_USERNAME"
  echo "DATABASE_NAME: $DATABASE_NAME"
  exit 1
fi

echo "Conexión a la base de datos establecida."

# Ejecutar migraciones
echo "Ejecutando migraciones de la base de datos..."
if bun drizzle-kit generate; then
  echo "Generación de migraciones completada."
  
  if bun drizzle-kit migrate; then
    echo "Migraciones aplicadas correctamente."
  else
    echo "Error al aplicar migraciones. Continuando de todos modos..."
  fi
else
  echo "Error al generar migraciones. Continuando de todos modos..."
fi

# Iniciar la aplicación
echo "Iniciando la aplicación..."
exec "$@"
