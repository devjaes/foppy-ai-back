# FoppyAI - Documentación Completa del Proyecto

## Índice
1. [Información General](#información-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Backend (API REST)](#backend-api-rest)
4. [Base de Datos](#base-de-datos)
5. [Características Implementadas](#características-implementadas)
6. [Tareas Pendientes y Bugs](#tareas-pendientes-y-bugs)
7. [Flujos de Datos](#flujos-de-datos)
8. [Configuración y Deployment](#configuración-y-deployment)

---

## 1. Información General

### Descripción del Proyecto
FoppyAI (anteriormente Fopymes) es un sistema de gestión de finanzas personales con capacidades de inteligencia artificial que permite a los usuarios controlar sus ingresos, gastos, metas de ahorro, presupuestos y deudas.

### Stack Tecnológico

#### Backend
- **Runtime**: Bun (JavaScript runtime y package manager)
- **Framework**: Hono.js v4.6.12
- **Base de Datos**: PostgreSQL
- **ORM**: Drizzle ORM v0.38.2
- **Validación**: Zod v3.23.8
- **Autenticación**: JWT con jose v5.9.6
- **Documentación API**: OpenAPI con @scalar/hono-api-reference
- **IA/ML**: LangChain v0.3.34, @langchain/core v0.3.77
- **Generación de Reportes**: 
  - Excel: exceljs v4.4.0
  - CSV: json2csv v6.0.0-alpha.2
  - PDF: pdf-lib v1.17.1, pdfkit v0.17.0
- **Emails**: @getbrevo/brevo v2.2.0
- **Tareas programadas**: cron v4.3.0
- **Logging**: pino v9.5.0, hono-pino v0.7.0
- **Utilidades**: date-fns v4.1.0, uuid v10.0.0

#### Frontend
**Nota**: Se requiere acceso a `/Users/jair/fopyments-app` para documentar completamente el frontend. La carpeta mencionada no está en los directorios permitidos actualmente.

### Directorios del Proyecto
- **Backend**: `/Users/jair/devProjects/fopymes-backend`
- **Frontend**: `/Users/jair/fopyments-app` (pendiente de acceso)
- **Base de Datos**: PostgreSQL - nombre: "database"

---

## 2. Arquitectura del Sistema

### Patrón Arquitectónico
El proyecto sigue una **Arquitectura Hexagonal (Ports & Adapters)** con principios de Clean Architecture.

### Estructura del Backend

```
src/
├── core/
│   └── infrastructure/
│       ├── database/          # Configuración de base de datos
│       │   ├── index.ts       # DatabaseConnection (Singleton)
│       │   └── schema.ts      # Esquemas Drizzle ORM
│       ├── env/               # Variables de entorno
│       ├── lib/               # Librerías compartidas
│       │   ├── create-app.ts  # Factory de aplicación Hono
│       │   ├── configure-open-api.ts
│       │   └── handler.wrapper.ts
│       ├── middleware/        # Middleware global
│       ├── types/             # Tipos globales
│       ├── cron/              # Trabajos programados
│       │   ├── budget-notifications.cron.ts
│       │   ├── debt-notifications.cron.ts
│       │   ├── expired-notifications.cron.ts
│       │   ├── financial-suggestions.cron.ts
│       │   ├── goal-notifications.cron.ts
│       │   ├── goal-suggestions.cron.ts
│       │   ├── recalculate-contribution-amount.cron.ts
│       │   └── scheduled-transactions.cron.ts
│       └── scripts/           # Scripts de utilidad
│           ├── categories.seed.ts
│           └── clean-database.ts
│
├── features/                  # Módulos por dominio
│   ├── ai-agents/
│   │   ├── application/       # Lógica de negocio
│   │   │   ├── dtos/
│   │   │   └── services/
│   │   ├── domain/            # Entidades y puertos
│   │   │   ├── entities/
│   │   │   └── ports/
│   │   └── infrastructure/    # Adaptadores
│   │       ├── adapters/
│   │       └── controllers/
│   ├── auth/
│   ├── budgets/
│   ├── categories/
│   ├── debts/
│   ├── email/
│   ├── friends/
│   ├── goals/
│   │   └── infrastucture/     # Nota: typo en el código original
│   ├── notifications/
│   ├── payment-methods/
│   ├── reports/
│   ├── scheduled-transactions/
│   ├── transactions/
│   └── users/
│
└── shared/                    # Código compartido
    ├── utils/                 # Funciones puras
    └── services/              # Servicios compartidos
```

### Capas de la Arquitectura Hexagonal

#### 1. Domain (Dominio)
- **Entidades**: Objetos de negocio puros
- **Ports (Puertos)**: Interfaces que definen contratos
- **Casos de uso**: Lógica de negocio independiente

#### 2. Application (Aplicación)
- **DTOs**: Data Transfer Objects
- **Services**: Servicios de aplicación
- **Use Cases**: Implementación de casos de uso

#### 3. Infrastructure (Infraestructura)
- **Adapters**: Implementaciones de puertos
  - Repositorios (PgXxxRepository)
  - Servicios externos
- **Controllers**: Controladores HTTP
- **Routes**: Definiciones de rutas OpenAPI

---

## 3. Backend (API REST)

### Punto de Entrada
**Archivo**: `src/index.ts`
```typescript
import { serve } from "bun";
import app from "./app";
import env from "@/env";

serve({
  fetch: app.fetch,
  port: env.PORT,
});
```

### Configuración de la Aplicación
**Archivo**: `src/app.ts`

#### Middleware Configurado
1. **CORS**: Configurado para localhost:3000, localhost:3001 y origen wildcard
2. **Logger**: Logging con pino
3. **Body Logger**: Middleware personalizado para loggear request bodies
4. **Authentication**: JWT validation en rutas protegidas

#### Rutas Registradas
```typescript
const routes = [
  index,              // GET /
  auth,               // /auth/*
  users,              // /users/*
  paymentMethods,     // /payment-methods/*
  transactions,       // /transactions/*
  goals,              // /goals/*
  budgets,            // /budgets/*
  scheduledTransactions, // /scheduled-transactions/*
  debts,              // /debts/*
  friends,            // /friends/*
  categories,         // /categories/*
  goalContributions,  // /goal-contributions/*
  goalContributionSchedules, // /goal-contribution-schedules/*
  notifications,      // /notifications/*
  email,              // /email/*
  reports,            // /reports/*
  aiAgents,           // /voice-command
  notificationSocket, // WebSocket para notificaciones
]
```

#### Trabajos Cron Iniciados
```typescript
// Comentado: startScheduledTransactionsJob();
startNotificationsCleanupJob();         // Limpieza de notificaciones expiradas
recalculateContributionAmountCron.start(); // Recalcula contribuciones a metas
startDebtNotificationsJob();            // Notificaciones de deudas
startBudgetSummaryJob();                // Resumen de presupuestos
startGoalNotificationsJob();            // Notificaciones de metas
startFinancialSuggestionsJob();         // Sugerencias financieras
startGoalSuggestionsJob();              // Sugerencias de metas
```

### Path Aliases (tsconfig.json)
```typescript
{
  "@/env": "./src/core/infrastructure/env/env.ts",
  "@/db": "./src/core/infrastructure/database/index.ts",
  "@/schema": "./src/core/infrastructure/database/schema.ts",
  "@/shared/*": "./src/shared/*",
  "@/users/*": "./src/features/users/*",
  "@/auth/*": "./src/features/auth/*",
  "@/payment-methods/*": "./src/features/payment-methods/*",
  "@/transactions/*": "./src/features/transactions/*",
  "@/goals/*": "./src/features/goals/*",
  "@/budgets/*": "./src/features/budgets/*",
  "@/scheduled-transactions/*": "./src/features/scheduled-transactions/*",
  "@/debts/*": "./src/features/debts/*",
  "@/categories/*": "./src/features/categories/*",
  "@/friends/*": "./src/features/friends/*",
  "@/email/*": "./src/features/email/*",
  "@/core/*": "./src/core/*",
  "@/notifications/*": "./src/features/notifications/*"
}
```

### Scripts Disponibles
```json
{
  "dev": "bun run --hot src/index.ts",
  "build": "bun build src/index.ts --outdir dist --target node --external bun",
  "migrate": "bun drizzle-kit migrate",
  "generate": "bun drizzle-kit generate",
  "db:seed": "bun run src/core/infrastructure/scripts/categories.seed.ts",
  "db:clean": "bun run src/core/infrastructure/scripts/clean-database.ts",
  "db:refresh": "bun run db:clean && bun run db:seed"
}
```

---

## 4. Base de Datos

### Tablas en PostgreSQL

#### 1. **users** - Usuarios del sistema
```sql
- id (serial, PK)
- name (varchar, NOT NULL)
- username (varchar, NOT NULL, UNIQUE)
- email (varchar, NOT NULL, UNIQUE)
- password_hash (varchar, NOT NULL)
- registration_date (timestamp, DEFAULT CURRENT_TIMESTAMP)
- active (boolean, DEFAULT true)
- recovery_token (varchar, NULLABLE)
- recovery_token_expires (timestamp, NULLABLE)
- created_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
- updated_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
```

#### 2. **categories** - Categorías de transacciones
```sql
- id (serial, PK)
- name (varchar, NOT NULL, UNIQUE)
- description (text)
- created_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
- updated_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
```

#### 3. **payment_methods** - Métodos de pago
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id, NOT NULL)
- shared_user_id (integer, FK -> users.id, NULLABLE)
- name (varchar, NOT NULL)
- type (varchar, NOT NULL)
- last_four_digits (varchar, NULLABLE)
- created_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
- updated_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
Índices: pm_user_idx, pm_shared_user_idx
```

#### 4. **transactions** - Transacciones financieras
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id, NOT NULL)
- amount (decimal(10,2), NOT NULL)
- type (varchar, NOT NULL) -- 'INCOME' | 'EXPENSE'
- category_id (integer, FK -> categories.id)
- description (text)
- payment_method_id (integer, FK -> payment_methods.id)
- date (timestamp, DEFAULT CURRENT_TIMESTAMP)
- scheduled_transaction_id (integer)
- debt_id (integer, FK -> debts.id)
- contribution_id (integer, FK -> goal_contributions.id)
- budget_id (integer, FK -> budgets.id)
- created_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
- updated_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
Índices: tx_user_idx, tx_date_idx, tx_category_idx, tx_budget_idx
```

#### 5. **goals** - Metas de ahorro
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id, NOT NULL)
- shared_user_id (integer, FK -> users.id, NULLABLE)
- name (varchar, NOT NULL)
- target_amount (decimal(10,2), NOT NULL)
- current_amount (decimal(10,2), DEFAULT 0)
- end_date (timestamp, NOT NULL)
- contribution_frequency (integer, NOT NULL) -- En días
- contribution_amount (decimal(10,2), NOT NULL)
- category_id (integer, FK -> categories.id)
- created_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
- updated_at (timestamp, DEFAULT CURRENT_TIMESTAMP)
Índices: goals_user_idx, goals_shared_user_idx
```

#### 6. **goal_contributions** - Contribuciones a metas
```sql
- id (serial, PK)
- goal_id (integer, FK -> goals.id)
- amount (decimal(10,2))
- date (timestamp)
- transaction_id (integer, FK -> transactions.id)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 7. **goal_contribution_schedule** - Programación de contribuciones
```sql
- id (serial, PK)
- goal_id (integer, FK -> goals.id)
- scheduled_date (timestamp)
- amount (decimal(10,2))
- status (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 8. **budgets** - Presupuestos
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id)
- category_id (integer, FK -> categories.id)
- amount (decimal(10,2))
- period (varchar) -- 'MONTHLY' | 'WEEKLY' | etc.
- start_date (timestamp)
- end_date (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 9. **scheduled_transactions** - Transacciones programadas
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id)
- amount (decimal(10,2))
- type (varchar)
- category_id (integer, FK -> categories.id)
- description (text)
- payment_method_id (integer, FK -> payment_methods.id)
- frequency (varchar) -- 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
- next_execution_date (timestamp)
- active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 10. **debts** - Deudas
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id)
- creditor_name (varchar)
- total_amount (decimal(10,2))
- remaining_amount (decimal(10,2))
- interest_rate (decimal(5,2))
- due_date (timestamp)
- status (varchar)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 11. **friends** - Relaciones entre usuarios
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id)
- friend_id (integer, FK -> users.id)
- status (varchar) -- 'PENDING' | 'ACCEPTED' | 'REJECTED'
- created_at (timestamp)
- updated_at (timestamp)
```

#### 12. **notifications** - Notificaciones del sistema
```sql
- id (serial, PK)
- user_id (integer, FK -> users.id)
- type (varchar)
- title (varchar)
- message (text)
- read (boolean)
- data (jsonb)
- created_at (timestamp)
- expires_at (timestamp)
```

#### 13. **reports** - Reportes generados
```sql
- id (varchar, PK) -- UUID
- user_id (integer, FK -> users.id)
- type (varchar) -- Ver ReportType enum
- format (varchar) -- 'JSON' | 'PDF' | 'EXCEL' | 'CSV'
- filters (jsonb)
- data (jsonb)
- created_at (timestamp)
- expires_at (timestamp)
```

### Relaciones Principales
1. **users** 1:N con **transactions**, **goals**, **budgets**, **debts**, **notifications**, **reports**
2. **users** N:N con **users** (friends)
3. **goals** 1:N con **goal_contributions**
4. **transactions** N:1 con **categories**, **payment_methods**, **budgets**, **debts**
5. **payment_methods** puede ser compartido entre usuarios

---

## 5. Características Implementadas

### 5.1 Autenticación y Usuarios
**Módulo**: `features/auth` y `features/users`

#### Funcionalidades
- Registro de usuarios
- Login con JWT
- Recuperación de contraseña (tokens temporales)
- Perfil de usuario
- Gestión de sesiones

#### Endpoints Principales
```
POST /auth/register
POST /auth/login
POST /auth/forgot-password
POST /auth/reset-password
GET /users/profile
PUT /users/profile
```

### 5.2 Métodos de Pago
**Módulo**: `features/payment-methods`

#### Funcionalidades
- CRUD de métodos de pago
- Soporte para compartir métodos entre usuarios
- Tipos: efectivo, tarjeta de crédito, tarjeta de débito, etc.

### 5.3 Categorías
**Módulo**: `features/categories`

#### Funcionalidades
- Categorías predefinidas del sistema
- CRUD de categorías
- Seed inicial de categorías comunes

### 5.4 Transacciones
**Módulo**: `features/transactions`

#### Funcionalidades
- Registro de ingresos y gastos
- Filtrado por fecha, categoría, tipo
- Vinculación con presupuestos, deudas y metas
- Soporte para transacciones recurrentes

#### Tipos de Transacciones
- **INCOME**: Ingresos
- **EXPENSE**: Gastos

### 5.5 Metas de Ahorro
**Módulo**: `features/goals`

#### Funcionalidades
- Creación de metas con monto objetivo y fecha límite
- Frecuencia de contribución configurable
- Seguimiento de progreso (current_amount vs target_amount)
- Metas compartidas entre usuarios
- Contribuciones manuales y automáticas
- Programación de contribuciones

#### Endpoints
```
POST /goals
GET /goals
GET /goals/:id
PUT /goals/:id
DELETE /goals/:id
POST /goals/:id/contributions
GET /goals/:id/contributions
```

### 5.6 Presupuestos
**Módulo**: `features/budgets`

#### Funcionalidades
- Presupuestos por categoría
- Períodos: mensual, semanal, anual
- Tracking automático de gastos vs presupuesto
- Alertas cuando se excede el presupuesto

### 5.7 Transacciones Programadas
**Módulo**: `features/scheduled-transactions`

#### Funcionalidades
- Transacciones recurrentes automáticas
- Frecuencias: diaria, semanal, mensual, anual
- Activación/desactivación de programaciones
- Generación automática vía cron job (actualmente deshabilitado)

### 5.8 Deudas
**Módulo**: `features/debts`

#### Funcionalidades
- Registro de deudas con acreedor
- Tasa de interés
- Tracking de pagos parciales
- Fecha de vencimiento
- Estados: activa, pagada, vencida

### 5.9 Amigos/Conexiones
**Módulo**: `features/friends`

#### Funcionalidades
- Solicitudes de amistad
- Aceptar/rechazar solicitudes
- Compartir metas y métodos de pago

### 5.10 Notificaciones
**Módulo**: `features/notifications`

#### Funcionalidades
- Sistema de notificaciones en tiempo real
- WebSocket para push notifications
- Notificaciones automáticas para:
  - Vencimiento de deudas
  - Progreso de metas
  - Exceso de presupuesto
  - Sugerencias financieras
- Expiración automática de notificaciones
- Marcado de leído/no leído

### 5.11 Reportes
**Módulo**: `features/reports`

#### Tipos de Reportes Disponibles
```typescript
enum ReportType {
  GOAL = "GOAL",
  CONTRIBUTION = "CONTRIBUTION",
  BUDGET = "BUDGET",
  EXPENSE = "EXPENSE",
  INCOME = "INCOME",
  GOALS_BY_STATUS = "GOALS_BY_STATUS",
  GOALS_BY_CATEGORY = "GOALS_BY_CATEGORY",
  CONTRIBUTIONS_BY_GOAL = "CONTRIBUTIONS_BY_GOAL",
  SAVINGS_COMPARISON = "SAVINGS_COMPARISON",
  SAVINGS_SUMMARY = "SAVINGS_SUMMARY",
}
```

#### Formatos de Exportación
- **JSON**: Datos estructurados
- **PDF**: Documentos imprimibles
- **Excel**: Hojas de cálculo (.xlsx)
- **CSV**: Archivos de texto separados por comas

#### Servicios de Generación
1. **ExcelService**: Genera reportes en formato Excel
2. **CSVService**: Genera reportes en formato CSV
3. **PDFService**: Genera reportes en formato PDF

#### Características
- Reportes temporales con expiración automática
- Filtros avanzados (fecha, categoría, usuario)
- Cleanup automático con cron job
- Endpoints RESTful para generación y descarga

#### Endpoints
```
POST /reports/generate
GET /reports/:id
DELETE /reports/:id
```

### 5.12 Agentes de IA
**Módulo**: `features/ai-agents`

#### Arquitectura del Sistema de Agentes

##### Componentes Principales
1. **VoiceOrchestratorService**: Orquestador principal
2. **Agentes Especializados**:
   - TransactionAgentService
   - GoalAgentService
   - BudgetAgentService
   - ValidationAgentService

##### Flujo de Procesamiento
```
Audio Input
    ↓
Transcripción (OpenAI Whisper)
    ↓
Clasificación de Intención (LLM)
    ↓
Extracción de Datos (LLM)
    ↓
Procesamiento por Agente
    ↓
Validación
    ↓
Respuesta Estructurada
```

##### Intenciones Soportadas
```typescript
enum CommandIntent {
  CREATE_TRANSACTION,
  CREATE_GOAL,
  CREATE_BUDGET,
  UNKNOWN
}
```

##### Endpoint
```
POST /voice-command
Content-Type: multipart/form-data
Body: audio file (audio/wav)

Response:
{
  "success": true,
  "intent": "CREATE_TRANSACTION",
  "extractedData": {...},
  "confidence": 0.95,
  "message": "...",
  "validationErrors": [],
  "suggestedCorrections": {}
}
```

##### Ejemplos de Comandos de Voz
**Transacciones**:
- "Gasté 25 dólares en comida"
- "Recibí 500 dólares de mi trabajo"

**Metas**:
- "Quiero ahorrar 1000 dólares para vacaciones hasta diciembre"

**Presupuestos**:
- "Crear un presupuesto de 300 dólares para comida este mes"

### 5.13 Email
**Módulo**: `features/email`

#### Funcionalidades
- Envío de emails con Brevo
- Notificaciones por correo
- Recuperación de contraseña

---

## 6. Tareas Pendientes y Bugs

### 6.1 Dashboard
**Estado**: Problemas críticos

#### Issues Identificados
1. **Cálculo de totales incorrecto**
   - Los totales de ingresos y gastos no están considerando todas las transacciones
   - Requiere revisión de la query de agregación

2. **Gastos por categoría no se muestran**
   - La visualización de distribución por categorías no funciona
   - Posible problema en el endpoint o en el frontend

3. **Falta de gráficos**
   - Necesita implementación de visualizaciones:
     - Gráfico de ingresos vs gastos
     - Distribución por categorías (pie chart)
     - Evolución temporal (line chart)
     - Progreso de metas

### 6.2 Reportes
**Estado**: Funcionalidad incompleta

#### Issues Identificados
1. **Información incompleta**
   - Reportes solo muestran títulos
   - Faltan detalles de transacciones
   - Algunos campos muestran "undefined"

2. **Traducciones faltantes**
   - Texto sin internacionalización (i18n)
   - Mezcla de español e inglés

3. **Tipos de reportes limitados**
   - Ampliar tipos disponibles (ver ReportType enum)
   - Agregar más filtros y opciones de agrupación

4. **Falta de gráficos en reportes**
   - Los reportes PDF/Excel no incluyen visualizaciones
   - Integrar los mismos gráficos del dashboard

5. **Errores intermitentes**
   - Reportes fallan aleatoriamente en generación
   - Requiere debugging y manejo de errores mejorado

### 6.3 Información de Usuario
**Estado**: Funcionalidad básica faltante

#### Tareas Pendientes
1. **Edición de perfil**
   - Actualizar nombre de usuario
   - Cambio de contraseña
   - Actualizar email
   - Foto de perfil

2. **Preferencias de usuario**
   - Moneda predeterminada
   - Idioma
   - Zona horaria
   - Notificaciones

### 6.4 Integración IA
**Estado**: Funcionalidad crítica no operativa

#### Issues Identificados
1. **Asistente inteligente no funciona**
   - El sistema de comandos de voz no responde
   - Posible problema con la API de OpenAI
   - Revisar integración con LangChain

2. **Funcionalidad de recomendaciones faltante**
   - Implementar sugerencias personalizadas basadas en:
     - Patrones de gasto
     - Metas de ahorro
     - Comportamiento histórico
   - Usar agentes de IA para análisis predictivo

3. **Creación de entidades vía agente virtual**
   - Revisar flujo de creación de:
     - Metas de ahorro
     - Presupuestos
     - Transacciones
   - Validar integraciones con repositorios

### 6.5 Bugs Críticos

#### Bug #1: Selección de categoría "Otros"
**Módulo**: Transacciones
**Descripción**: Al registrar una transacción, seleccionar la categoría "Otros" falla
**Posibles Causas**:
- Validación incorrecta en el formulario
- ID de categoría "Otros" no existe en BD
- Problema en el componente de selección

#### Bug #2: Cálculo erróneo de totales en Dashboard
**Módulo**: Dashboard
**Descripción**: Los totales no reflejan todos los ingresos y gastos
**Investigar**:
- Query de agregación en el backend
- Filtros de fecha aplicados
- Transacciones excluidas (deudas, contribuciones a metas)

#### Bug #3: Error en generación de reportes
**Módulo**: Reportes
**Descripción**: Reportes fallan intermitentemente
**Investigar**:
- Logs de errores específicos
- Timeouts en queries grandes
- Problemas con generación de PDF/Excel
- Validación de datos antes de generar reporte

#### Bug #4: Notificaciones duplicadas de metas
**Módulo**: Notificaciones
**Descripción**: Las advertencias de metas de ahorro se muestran múltiples veces
**Investigar**:
- Lógica del cron job de notificaciones
- Verificación de notificaciones existentes
- Sistema de deduplicación

---

## 7. Flujos de Datos

### 7.1 Flujo de Creación de Transacción

```
Usuario → Frontend
    ↓
POST /transactions
    ↓
TransactionController
    ↓
CreateTransactionUseCase
    ↓
TransactionService
    ↓
PgTransactionRepository
    ↓
Database (transactions table)
    ↓
[Si está vinculado a Budget]
    → UpdateBudgetUseCase
    → Verificar límite
    → Crear notificación si excede
    ↓
[Si está vinculado a Goal]
    → CreateGoalContributionUseCase
    → Actualizar current_amount
    ↓
Response → Frontend
```

### 7.2 Flujo de Creación de Meta

```
Usuario → Frontend
    ↓
POST /goals
    ↓
GoalController
    ↓
CreateGoalUseCase
    ↓
GoalService
    ├→ Calcular contribution_amount automático
    │  basado en:
    │  - target_amount
    │  - end_date
    │  - contribution_frequency
    ↓
PgGoalRepository
    ↓
Database (goals table)
    ↓
[Opcional] GoalContributionScheduleService
    → Generar programación de contribuciones
    → Crear registros en goal_contribution_schedule
    ↓
Response → Frontend
```

### 7.3 Flujo de Comando de Voz

```
Usuario graba audio → Frontend
    ↓
POST /voice-command (multipart/form-data)
    ↓
VoiceCommandController
    ↓
VoiceOrchestratorService
    ├→ 1. Transcribir audio (Whisper API)
    ├→ 2. Clasificar intención (LLM)
    ├→ 3. Extraer entidades (LLM)
    │   - amount, description, category, etc.
    ↓
[Routing basado en intent]
    ├→ CREATE_TRANSACTION → TransactionAgentService
    ├→ CREATE_GOAL → GoalAgentService
    ├→ CREATE_BUDGET → BudgetAgentService
    ↓
ValidationAgentService
    ├→ Validar datos extraídos
    ├→ Corregir inconsistencias
    ├→ Completar datos faltantes
    ↓
Response con extractedData → Frontend
    ↓
Frontend muestra formulario pre-llenado
    ↓
Usuario confirma o edita
    ↓
Crear entidad normalmente
```

### 7.4 Flujo de Generación de Reportes

```
Usuario solicita reporte → Frontend
    ↓
POST /reports/generate
Body: {
  type: ReportType,
  format: ReportFormat,
  filters: {...}
}
    ↓
ReportController
    ↓
ReportServiceImpl
    ├→ Validar tipo y filtros
    ├→ Ejecutar query específico según type:
    │   ├→ GOAL → PgGoalRepository.findByFilters()
    │   ├→ EXPENSE → PgTransactionRepository.findExpenses()
    │   ├→ SAVINGS_SUMMARY → Múltiples queries agregadas
    │   └→ ...
    ↓
Generar datos estructurados (JSON)
    ↓
PgReportRepository.create()
    → Guardar en tabla reports
    → Calcular expiresAt (24-72 horas)
    ↓
Response: { id: uuid, type, format, ... }
    ↓
Frontend redirige a GET /reports/:id
    ↓
ReportController.getReport()
    ├→ PgReportRepository.findById()
    ├→ Verificar expiración
    │
    ├→ [Si format === JSON]
    │   → Return c.json(report.data)
    │
    ├→ [Si format === PDF]
    │   → PDFService.generatePDF(report)
    │   → Return Response(buffer, headers)
    │
    ├→ [Si format === EXCEL]
    │   → ExcelService.generateExcel(report)
    │   → Return Response(buffer, headers)
    │
    └→ [Si format === CSV]
        → CSVService.generateCSV(report)
        → Return Response(buffer, headers)
    ↓
Download automático en navegador
```

### 7.5 Flujo de Notificaciones

```
[Trigger: Cron Job o Evento]
    ↓
NotificationService
    ├→ Tipo: BUDGET_EXCEEDED
    │   └→ BudgetService detecta exceso
    │
    ├→ Tipo: GOAL_WARNING
    │   └→ GoalService detecta atraso
    │
    ├→ Tipo: DEBT_DUE
    │   └→ DebtService detecta vencimiento próximo
    │
    └→ Tipo: FINANCIAL_SUGGESTION
        └→ AIAgentService genera sugerencia
    ↓
PgNotificationRepository.create({
  user_id,
  type,
  title,
  message,
  data: {...},
  expires_at
})
    ↓
Database (notifications table)
    ↓
[WebSocket Push]
    → NotificationSocket
    → Enviar a cliente conectado
    → Frontend muestra notificación
    ↓
[Email opcional]
    → EmailService
    → Brevo API
    → Enviar correo
```

---

## 8. Configuración y Deployment

### 8.1 Variables de Entorno

**Archivo**: `.env`

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=database
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION=7d

# OpenAI (para agentes de IA)
OPENAI_API_KEY=your_openai_api_key

# Brevo (Email)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@foppyai.com
BREVO_SENDER_NAME=FoppyAI

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3001
```

### 8.2 Docker

**Archivo**: `docker-compose.yaml`

El proyecto incluye configuración Docker para ejecutar PostgreSQL:

```bash
# Iniciar base de datos
docker compose up -d

# Detener
docker compose down

# Ver logs
docker compose logs -f
```

### 8.3 Migraciones de Base de Datos

#### Generar Migraciones
```bash
bun drizzle-kit generate
```

#### Ejecutar Migraciones
```bash
bun drizzle-kit migrate
```

#### Drizzle Studio (GUI)
```bash
bun drizzle-kit studio
```

### 8.4 Seed de Datos

#### Limpiar Base de Datos
```bash
bun run db:clean
```

#### Seed de Categorías
```bash
bun run db:seed
```

#### Refresh Completo
```bash
bun run db:refresh
```

### 8.5 Desarrollo

#### Iniciar Servidor de Desarrollo
```bash
bun install
bun run dev
```

El servidor se iniciará en `http://localhost:3000` con hot reload habilitado.

#### Documentación API
Una vez iniciado el servidor, la documentación OpenAPI está disponible en:
```
http://localhost:3000/reference
```

### 8.6 Producción

#### Build
```bash
bun run build
```

#### Deployment
El proyecto incluye `Dockerfile` y configuración para deployment con Docker:

```bash
# Build imagen
docker build -t foppyai-backend .

# Run container
docker run -p 3000:3000 --env-file .env foppyai-backend
```

---

## 9. Mejoras Técnicas Sugeridas

### 9.1 Prioridad Alta

1. **Testing**
   - Implementar pruebas unitarias (casos de uso)
   - Pruebas de integración (repositorios)
   - E2E tests para flujos críticos
   - Coverage mínimo: 70%

2. **Manejo de Errores**
   - Middleware centralizado de errores
   - Códigos de error consistentes
   - Logging estructurado
   - Alertas para errores críticos

3. **Validación de Datos**
   - Validación exhaustiva con Zod en todos los endpoints
   - DTOs bien definidos
   - Sanitización de inputs

4. **Seguridad**
   - Rate limiting
   - Helmet middleware
   - Validación de CSRF
   - Auditoría de accesos

### 9.2 Prioridad Media

1. **Performance**
   - Implementar caché (Redis)
   - Paginación en todos los listados
   - Índices de base de datos optimizados
   - Query optimization

2. **Documentación**
   - Ampliar documentación OpenAPI
   - Guías de integración
   - Ejemplos de uso de API
   - Diagramas de arquitectura

3. **Monitoreo**
   - APM (Application Performance Monitoring)
   - Health checks
   - Métricas de negocio
   - Dashboards operacionales

### 9.3 Prioridad Baja

1. **Internacionalización**
   - Sistema i18n completo
   - Soporte multi-idioma
   - Formatos de fecha/moneda localizados

2. **Features Avanzadas**
   - Exportación de datos completa
   - Importación desde archivos CSV
   - Integraciones con bancos (Open Banking)
   - Aplicación móvil nativa

---

## 10. Patrones y Mejores Prácticas

### 10.1 Patrones Implementados

1. **Singleton**: DatabaseConnection, Repositorios
2. **Repository Pattern**: Abstracción de acceso a datos
3. **Dependency Injection**: Servicios reciben dependencias
4. **Factory Pattern**: createApp, createRouter
5. **Strategy Pattern**: Agentes especializados de IA

### 10.2 Convenciones de Código

#### Nomenclatura
- **Archivos**: kebab-case (user-controller.ts)
- **Clases**: PascalCase (UserService)
- **Funciones**: camelCase (createUser)
- **Constantes**: UPPER_SNAKE_CASE (MAX_RETRIES)

#### Estructura de Archivos
```
feature/
├── application/
│   ├── dtos/
│   │   └── create-xxx.dto.ts
│   └── services/
│       └── xxx.service.ts
├── domain/
│   ├── entities/
│   │   └── xxx.entity.ts
│   └── ports/
│       └── xxx.repository.interface.ts
└── infrastructure/
    ├── adapters/
    │   └── xxx.repository.ts
    └── controllers/
        ├── xxx.controller.ts
        └── xxx.routes.ts
```

#### Respuestas API Consistentes
```typescript
// Success
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}

// Error
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

---

## 11. Conclusiones y Próximos Pasos

### Estado Actual
FoppyAI es un sistema de gestión financiera personal robusto con características avanzadas de IA. La arquitectura hexagonal proporciona una base sólida para el crecimiento futuro.

### Áreas de Enfoque Inmediato

1. **Resolver bugs críticos** (Dashboard, Reportes, Categorías)
2. **Completar funcionalidad de reportes**
3. **Reparar integración de IA**
4. **Implementar edición de perfil de usuario**
5. **Agregar tests automatizados**

### Roadmap Sugerido

**Q1 2025**
- Corrección de bugs críticos
- Completar reportes con gráficos
- Dashboard funcional completo
- Testing básico (>50% coverage)

**Q2 2025**
- Sistema de IA completamente operativo
- Recomendaciones personalizadas
- Aplicación móvil (React Native)
- Integraciones bancarias

**Q3 2025**
- Multi-tenancy
- Planes de suscripción
- Features premium
- Escalabilidad horizontal

---

## Apéndices

### A. Endpoints de API (Resumen)

#### Autenticación
- POST /auth/register
- POST /auth/login
- POST /auth/forgot-password
- POST /auth/reset-password

#### Usuarios
- GET /users/profile
- PUT /users/profile

#### Transacciones
- POST /transactions
- GET /transactions
- GET /transactions/:id
- PUT /transactions/:id
- DELETE /transactions/:id

#### Metas
- POST /goals
- GET /goals
- GET /goals/:id
- PUT /goals/:id
- DELETE /goals/:id
- POST /goals/:id/contributions

#### Reportes
- POST /reports/generate
- GET /reports/:id
- DELETE /reports/:id

#### IA
- POST /voice-command

### B. Referencias

- [Hono.js Documentation](https://hono.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Bun Documentation](https://bun.sh/docs)
- [LangChain Documentation](https://js.langchain.com/)
- [OpenAPI Specification](https://swagger.io/specification/)

---

**Última Actualización**: Octubre 2025  
**Versión**: 1.0.0  
**Mantenedor**: Equipo FoppyAI