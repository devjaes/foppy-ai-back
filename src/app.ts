import index from "./core/infrastructure/index.route";
import createApp from "./core/infrastructure/lib/create-app";
import configureOpenAPI from "./core/infrastructure/lib/configure-open-api";
import users from "@/users/infrastructure/controllers/user.controller";
import paymentMethods from "@/payment-methods/infrastructure/controllers/payment-method.controller";
import transactions from "@/transactions/infrastructure/controllers/transaction.controller";
import goals from "@/goals/infrastucture/controllers/goal.controller";
import budgets from "@/budgets/infrastructure/controllers/budget.controller";
import scheduledTransactions from "@/scheduled-transactions/infrastructure/controllers/scheduled-transaction.controller";
import debts from "@/debts/infrastructure/controllers/debt.controller";
import friends from "@/friends/infrastructure/controllers/friend.controller";
import auth from "@/auth/infrastructure/controllers/auth.controller";
import categories from "@/categories/infrastructure/controllers/category.controller";
import goalContributions from "@/goals/infrastucture/controllers/goal-contribution.controller";
import goalContributionSchedules from "@/goals/infrastucture/controllers/goal-contribution-schedule.controller";
import notifications from "@/notifications/infrastructure/controllers/notification.controller";
import DatabaseConnection from "@/db";
import email from "@/email/infrastructure/controllers/email.controller";
import notificationSocket from "@/notifications/infrastructure/websocket/notification-socket.router";
import { startScheduledTransactionsJob } from "./core/infrastructure/cron/scheduled-transactions.cron";
import { startNotificationsCleanupJob } from "./core/infrastructure/cron/expired-notifications.cron";
import { startDebtNotificationsJob } from "./core/infrastructure/cron/debt-notifications.cron";
import { startBudgetSummaryJob } from "./core/infrastructure/cron/budget-notifications.cron";
import { startGoalNotificationsJob } from "./core/infrastructure/cron/goal-notifications.cron";
import { startFinancialSuggestionsJob } from "./core/infrastructure/cron/financial-suggestions.cron";
import { startGoalSuggestionsJob } from "./core/infrastructure/cron/goal-suggestions.cron";
import { startDailyRecommendationsJob } from "./core/infrastructure/cron/daily-recommendations.cron";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createMiddleware } from "hono/factory";
import { recalculateContributionAmountCron } from "./core/infrastructure/cron/recalculate-contribution-amount.cron";
import { CleanupReportsCron } from "./features/reports/infrastructure/cron/cleanup-reports.cron";
import { ReportServiceImpl } from "./features/reports/application/services/report.service";
import { PgReportRepository } from "./features/reports/infrastructure/adapters/report.repository";
import { PgBudgetRepository } from "./features/budgets/infrastructure/adapters/budget.repository";
import { PgTransactionRepository } from "./features/transactions/infrastructure/adapters/transaction.repository";
import { PgGoalRepository } from "./features/goals/infrastucture/adapters/goal.repository";
import { PgGoalContributionRepository } from "./features/goals/infrastucture/adapters/goal-contribution.repository";
import { ExcelService } from "./features/reports/infrastructure/services/excel.service";
import { CSVService } from "./features/reports/infrastructure/services/csv.service";
import reports from "./features/reports/infrastructure/controllers/report.controller";
import aiAgents from "./features/ai-agents/infrastructure/controllers/voice-command.controller";
import recommendations from "./features/recommendations/infrastructure/controllers/recommendation.controller";

const app = createApp();

// startScheduledTransactionsJob();
startNotificationsCleanupJob();
recalculateContributionAmountCron.start();

startDebtNotificationsJob();
startBudgetSummaryJob();
startGoalNotificationsJob();
startFinancialSuggestionsJob();
startGoalSuggestionsJob();
startDailyRecommendationsJob();
configureOpenAPI(app);

// Configuración CORS mejorada
app.use(
  cors({
    origin: ['http://localhost:3001', 'http://localhost:3000', '*'],
    allowHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision']
  })
);

// agrega logs a la app, que logguee tambien el body de requests
app.use(logger());

// Custom middleware para loguear el body de los requests
const logBodyMiddleware = createMiddleware(async (c, next) => {
  // Clonar el request para poder leer el body sin consumirlo
  const clonedReq = c.req.raw.clone();
  let body = "";

  try {
    // Intentar leer el body como JSON
    const contentType = c.req.header("content-type");
    if (contentType && contentType.includes("application/json")) {
      const bodyText = await clonedReq.text();
      if (bodyText) {
        body = bodyText;
        console.log(`Request Body: ${body}`);
      }
    }
  } catch (e) {
    // Si hay error al leer el body, ignorar
    console.error("Error reading request body:", e);
  }

  await next();
});

app.use(logBodyMiddleware);

const routes = [
  index,
  auth,
  users,
  paymentMethods,
  transactions,
  goals,
  budgets,
  scheduledTransactions,
  debts,
  friends,
  categories,
  goalContributions,
  goalContributionSchedules,
  notifications,
  email,
  reports,
  aiAgents,
  recommendations,
  notificationSocket,
] as const;

app.get("/debug/db-status", (c) => {
  const db = DatabaseConnection.getInstance();
  return c.json({
    poolStatus: db.getPoolStatus(),
    timestamp: new Date().toISOString(),
  });
});

routes.forEach((route) => {
  app.route("/", route);
});

export type AppType = (typeof routes)[number];

export default app;
