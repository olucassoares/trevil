import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  priceCents: integer("price_cents").notNull(),
  stock: integer("stock").notNull().default(0),
  reservedStock: integer("reserved_stock").notNull().default(0),
  reorderPoint: integer("reorder_point").notNull().default(5),
  status: text("status", { enum: ["active", "archived"] }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("products_stock_idx").on(table.stock),
  check("products_stock_bounds_check", sql`${table.stock} >= 0 AND ${table.reservedStock} >= 0 AND ${table.reservedStock} <= ${table.stock}`),
]);

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  segment: text("segment", { enum: ["new", "returning", "vip"] }).notNull().default("new"),
  totalSpentCents: integer("total_spent_cents").notNull().default(0),
  orderCount: integer("order_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: integer("id").primaryKey().generatedByDefaultAsIdentity(),
  number: text("number").notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id),
  status: text("status", { enum: ["pending", "paid", "processing", "shipped", "delivered", "canceled"] }).notNull(),
  paymentStatus: text("payment_status", { enum: ["pending", "paid", "refunded"] }).notNull(),
  totalCents: integer("total_cents").notNull(),
  channel: text("channel", { enum: ["store", "marketplace", "social"] }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("orders_status_idx").on(table.status), index("orders_created_idx").on(table.createdAt), index("orders_customer_idx").on(table.customerId)]);

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId), index("order_items_product_idx").on(table.productId)]);

export const orderEvents = pgTable("order_events", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  action: text("action").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actor: text("actor").notNull(),
  details: text("details").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("order_events_order_idx").on(table.orderId)]);

export const stockMovements = pgTable("stock_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().references(() => products.id),
  orderId: integer("order_id").references(() => orders.id),
  type: text("type", { enum: ["reserve", "release", "sale", "restock"] }).notNull(),
  quantity: integer("quantity").notNull(),
  actor: text("actor").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("stock_movements_product_idx").on(table.productId), index("stock_movements_order_idx").on(table.orderId)]);

export const userRoles = pgTable("user_roles", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "manager", "viewer"] }).notNull().default("viewer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
