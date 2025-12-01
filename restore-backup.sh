#!/bin/bash

# Script para restaurar el backup de la base de datos
# Uso: ./restore-backup.sh [nombre_del_backup.sql]

BACKUP_FILE=${1:-$(ls -t backup_*.sql | head -1)}

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: No se encontró el archivo de backup: $BACKUP_FILE"
    echo "Archivos de backup disponibles:"
    ls -lh backup_*.sql 2>/dev/null || echo "No hay archivos de backup"
    exit 1
fi

echo "📦 Restaurando backup: $BACKUP_FILE"
echo "⚠️  Esto borrará todos los datos actuales en la base de datos 'database'"
read -p "¿Continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Operación cancelada"
    exit 1
fi

# Asegurar que el contenedor esté corriendo
echo "🔧 Verificando contenedor de base de datos..."
docker compose up -d db

# Esperar a que PostgreSQL esté listo
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 5

# Restaurar el backup
echo "📥 Restaurando datos..."
docker exec -i container psql -U username -d database < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup restaurado exitosamente!"
    echo "📊 Verificando datos..."
    docker exec container psql -U username -d database -c "SELECT COUNT(*) as total_tablas FROM information_schema.tables WHERE table_schema = 'public';"
else
    echo "❌ Error al restaurar el backup"
    exit 1
fi

