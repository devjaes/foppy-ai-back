import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  integer,
  decimal,
  text,
  date,
  index,
  jsonb,
  PgTableWithColumns,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  username: varchar("username").notNull().unique(),
  email: varchar("email").notNull().unique(),
  password_hash: varchar("password_hash").notNull(),
  registration_date: timestamp("registration_date")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  active: boolean("active").default(true).notNull(),
  recovery_token: varchar("recovery_token"),
  recovery_token_expires: timestamp("recovery_token_expires"),
  recommendations_enabled: boolean("recommendations_enabled")
    .default(false)
    .notNull(),
  created_at: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull().unique(),
  description: text("description"),
  created_at: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const payment_methods = pgTable(
  "payment_methods",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    shared_user_id: integer("shared_user_id").references(() => users.id),
    name: varchar("name").notNull(),
    type: varchar("type").notNull(),
    last_four_digits: varchar("last_four_digits"),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("pm_user_idx").on(table.user_id),
      shared_user_idx: index("pm_shared_user_idx").on(table.shared_user_id),
    };
  }
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    type: varchar("type").notNull(),
    category_id: integer("category_id").references(() => categories.id),
    description: text("description"),
    payment_method_id: integer("payment_method_id").references(
      () => payment_methods.id
    ),
    date: timestamp("date")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    scheduled_transaction_id: integer("scheduled_transaction_id"),
    debt_id: integer("debt_id").references(() => debts.id),
    contribution_id: integer("contribution_id").references(
      () => goal_contributions.id
    ),
    budget_id: integer("budget_id").references(() => budgets.id),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("tx_user_idx").on(table.user_id),
      date_idx: index("tx_date_idx").on(table.date),
      category_idx: index("tx_category_idx").on(table.category_id),
      budget_idx: index("tx_budget_idx").on(table.budget_id),
    };
  }
);

export const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    shared_user_id: integer("shared_user_id").references(() => users.id),
    name: varchar("name").notNull(),
    target_amount: decimal("target_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    current_amount: decimal("current_amount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    end_date: timestamp("end_date").notNull(),
    contribution_frequency: integer("contribution_frequency").notNull(),
    contribution_amount: decimal("contribution_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    category_id: integer("category_id").references(() => categories.id),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("goals_user_idx").on(table.user_id),
      shared_user_idx: index("goals_shared_user_idx").on(table.shared_user_id),
    };
  }
);

// Breaking circular reference by declaring table schema first
const goalContributionsSchema = {
  id: serial("id").primaryKey(),
  goal_id: integer("goal_id")
    .references(() => goals.id)
    .notNull(),
  user_id: integer("user_id")
    .references(() => users.id)
    .notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  created_at: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
};

export const goal_contributions = pgTable(
  "goal_contributions",
  goalContributionsSchema,
  (table) => {
    return {
      goal_idx: index("gc_goal_idx").on(table.goal_id),
      user_idx: index("gc_user_idx").on(table.user_id),
      date_idx: index("gc_date_idx").on(table.date),
    };
  }
);

export const goal_contribution_schedule = pgTable(
  "goal_contribution_schedule",
  {
    id: serial("id").primaryKey(),
    goal_id: integer("goal_id")
      .references(() => goals.id)
      .notNull(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    scheduled_date: timestamp("scheduled_date").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status").notNull().default("pending"),
    contribution_id: integer("contribution_id").references(
      () => goal_contributions.id
    ),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      goal_idx: index("gcs_goal_idx").on(table.goal_id),
      user_idx: index("gcs_user_idx").on(table.user_id),
      date_idx: index("gcs_date_idx").on(table.scheduled_date),
      status_idx: index("gcs_status_idx").on(table.status),
    };
  }
);
export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    shared_user_id: integer("shared_user_id").references(() => users.id),
    category_id: integer("category_id").references(() => categories.id),
    limit_amount: decimal("limit_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    current_amount: decimal("current_amount", { precision: 10, scale: 2 })
      .default("0")
      .notNull(),
    month: timestamp("month").notNull(),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("budget_user_idx").on(table.user_id),
      category_idx: index("budget_category_idx").on(table.category_id),
      month_idx: index("budget_month_idx").on(table.month),
    };
  }
);

export const scheduled_transactions = pgTable(
  "scheduled_transactions",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    name: varchar("name").notNull(),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    category_id: integer("category_id").references(() => categories.id),
    description: text("description"),
    payment_method_id: integer("payment_method_id").references(
      () => payment_methods.id
    ),
    frequency: varchar("frequency").notNull(),
    next_execution_date: timestamp("next_execution_date").notNull(),
    active: boolean("active").default(true).notNull(),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("st_user_idx").on(table.user_id),
      next_date_idx: index("st_next_date_idx").on(table.next_execution_date),
    };
  }
);

export const friends = pgTable(
  "friends",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    friend_id: integer("friend_id")
      .references(() => users.id)
      .notNull(),
    connection_date: timestamp("connection_date")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("friends_user_idx").on(table.user_id),
      friend_idx: index("friends_friend_idx").on(table.friend_id),
    };
  }
);

export const debts = pgTable(
  "debts",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    description: text("description").notNull(),
    original_amount: decimal("original_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    pending_amount: decimal("pending_amount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    due_date: timestamp("due_date").notNull(),
    paid: boolean("paid").default(false).notNull(),
    creditor_id: integer("creditor_id").references(() => users.id),
    category_id: integer("category_id").references(() => categories.id),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("debts_user_idx").on(table.user_id),
      creditor_idx: index("debts_creditor_idx").on(table.creditor_id),
      due_date_idx: index("debts_due_date_idx").on(table.due_date),
    };
  }
);

export const notifications = pgTable(
  "notifications",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    title: varchar("title").notNull(),
    subtitle: varchar("subtitle"),
    message: text("message").notNull(),
    read: boolean("read").default(false).notNull(),
    type: varchar("type").notNull(),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expires_at: timestamp("expires_at"),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("notif_user_idx").on(table.user_id),
      read_idx: index("notif_read_idx").on(table.read),
      expires_idx: index("notif_expires_idx").on(table.expires_at),
    };
  }
);

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  user_id: integer("user_id").references(() => users.id),
  type: varchar("type").notNull(),
  format: varchar("format").notNull(),
  data: jsonb("data").notNull(),
  created_at: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  expires_at: timestamp("expires_at").notNull(),
});

export const recommendations = pgTable(
  "recommendations",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(),
    priority: varchar("priority", { length: 20 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description").notNull(),
    data: jsonb("data"),
    actionable: boolean("actionable").default(false).notNull(),
    actions: jsonb("actions"),
    status: varchar("status", { length: 20 }).default("PENDING").notNull(),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    expires_at: timestamp("expires_at"),
    viewed_at: timestamp("viewed_at"),
    dismissed_at: timestamp("dismissed_at"),
    acted_at: timestamp("acted_at"),
  },
  (table) => {
    return {
      user_idx: index("rec_user_idx").on(table.user_id),
      status_idx: index("rec_status_idx").on(table.status),
      type_idx: index("rec_type_idx").on(table.type),
      created_idx: index("rec_created_idx").on(table.created_at),
    };
  }
);

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  duration_days: integer("duration_days").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  frequency: varchar("frequency").notNull(),
  description: text("description"),
  features: jsonb("features").$type<string[]>(),
  created_at: timestamp("created_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updated_at: timestamp("updated_at")
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id")
      .references(() => users.id)
      .notNull(),
    plan_id: integer("plan_id")
      .references(() => plans.id)
      .notNull(),
    frequency: varchar("frequency").notNull(),
    start_date: timestamp("start_date")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    end_date: timestamp("end_date").notNull(),
    retirement_date: timestamp("retirement_date"),
    active: boolean("active").default(true).notNull(),
    created_at: timestamp("created_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updated_at: timestamp("updated_at")
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => {
    return {
      user_idx: index("sub_user_idx").on(table.user_id),
      plan_idx: index("sub_plan_idx").on(table.plan_id),
      active_idx: index("sub_active_idx").on(table.active),
    };
  }
);
