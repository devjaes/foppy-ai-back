# Plan de Testing - Fopymes Backend

## Objetivo
Implementar tests unitarios y de integración para las funcionalidades más importantes del sistema de finanzas personales.

## Stack de Testing
- **Framework**: Bun Test (nativo de Bun)
- **Base de datos de pruebas**: PostgreSQL (contenedor Docker separado o base de datos de test)
- **Mocks**: Bun test mocking capabilities

## Estructura de Tests

```
tests/
├── unit/
│   ├── utils/
│   │   ├── crypto.util.test.ts
│   │   ├── jwt.util.test.ts
│   │   └── date.utils.test.ts
│   ├── services/
│   │   ├── auth.service.test.ts
│   │   ├── transaction.service.test.ts
│   │   ├── goal.service.test.ts
│   │   └── goal-contribution.service.test.ts
│   └── cron/
│       └── recalculate-contribution-amount.test.ts
├── integration/
│   ├── auth.test.ts
│   ├── transactions.test.ts
│   ├── goals.test.ts
│   └── recommendations.test.ts
└── helpers/
    ├── test-db.ts
    ├── test-helpers.ts
    └── mocks.ts
```

## Features a Probar (Prioridad)

### Alta Prioridad
1. **Autenticación (Auth)**
   - Login con credenciales válidas/inválidas
   - Registro de usuarios
   - Recuperación de contraseña
   - Validación de tokens JWT

2. **Transacciones**
   - Crear transacción (ingreso/gasto)
   - Actualizar transacción
   - Filtrar transacciones por fecha, tipo, categoría
   - Validación de métodos de pago

3. **Metas de Ahorro (Goals)**
   - Crear meta
   - Crear contribución a meta
   - Actualizar progreso de meta
   - Generar calendario de contribuciones
   - Recalcular monto de contribución (cron job)

4. **Recomendaciones**
   - Obtener recomendaciones pendientes
   - Marcar como vista/descartada/actuada

### Media Prioridad
5. **Presupuestos (Budgets)**
   - Crear presupuesto
   - Validar límites de presupuesto

6. **Deudas (Debts)**
   - Crear deuda
   - Registrar pago de deuda

## Tests Unitarios

### 1. Utilidades (Utils)
- **crypto.util.test.ts**
  - `hash()`: Debe generar hash válido
  - `verify()`: Debe verificar password correcto/incorrecto

- **jwt.util.test.ts**
  - `generateToken()`: Debe generar token JWT válido
  - `verifyToken()`: Debe verificar token válido/inválido/expirado

### 2. Servicios (Services)
- **auth.service.test.ts**
  - Login exitoso
  - Login con credenciales inválidas
  - Registro exitoso
  - Registro con email duplicado
  - Recuperación de contraseña

- **transaction.service.test.ts**
  - Crear transacción válida
  - Validar método de pago
  - Filtrar transacciones
  - Actualizar transacción

- **goal.service.test.ts**
  - Crear meta válida
  - Validar usuario compartido
  - Calcular progreso

- **goal-contribution.service.test.ts**
  - Crear contribución
  - Actualizar progreso de meta
  - Notificaciones de hitos

### 3. Cron Jobs
- **recalculate-contribution-amount.test.ts**
  - Recalcular monto para metas inactivas
  - Generar notificaciones de recálculo
  - Evitar duplicados

## Tests de Integración

### 1. Auth Endpoints
- `POST /auth/login` - 200, 400
- `POST /auth/register` - 201, 400
- `POST /auth/forgot-password` - 200, 404

### 2. Transaction Endpoints
- `POST /transactions` - 201, 400, 404
- `GET /transactions?userId=X` - 200
- `PUT /transactions/:id` - 200, 404

### 3. Goal Endpoints
- `POST /goals` - 201, 400, 404
- `GET /goals?userId=X` - 200
- `POST /goal-contributions` - 201, 400, 404

### 4. Recommendation Endpoints
- `GET /recommendations/pending?userId=X` - 200, 401
- `PUT /recommendations/:id/viewed` - 200, 404
- `PUT /recommendations/:id/dismissed` - 200, 404

## Configuración

### Variables de Entorno de Test
```env
NODE_ENV=test
DATABASE_URL=postgresql://user:password@localhost:5432/fopymes_test
JWT_SECRET=test-secret-key
```

### Scripts en package.json
```json
{
  "test": "bun test",
  "test:unit": "bun test tests/unit",
  "test:integration": "bun test tests/integration",
  "test:watch": "bun test --watch"
}
```

## Cobertura Objetivo
- **Cobertura mínima**: 60% de código crítico
- **Cobertura ideal**: 80% de código crítico
- **Enfoque**: Servicios de negocio, utilidades críticas, endpoints principales

## Notas de Implementación
- Usar base de datos de test separada
- Limpiar datos entre tests
- Usar factories para crear datos de prueba
- Mockear servicios externos (email, etc.)
- Verificar cada suite de tests antes de continuar


