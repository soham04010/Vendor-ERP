const { pgTable, uuid, varchar, text, decimal, timestamp, boolean, integer, date, jsonb } = require('drizzle-orm/pg-core');

const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  gst_number: varchar('gst_number', { length: 20 }),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 100 }),
  pincode: varchar('pincode', { length: 10 }),
  status: varchar('status', { length: 20 }).default('active'),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  created_by: uuid('created_by'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  vendor_id: uuid('vendor_id').references(() => vendors.id, { onDelete: 'set null' }),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const rfqs = pgTable('rfqs', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfq_number: varchar('rfq_number', { length: 50 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  deadline: timestamp('deadline', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 30 }).default('draft'),
  created_by: uuid('created_by').references(() => users.id).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const rfq_items = pgTable('rfq_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfq_id: uuid('rfq_id').references(() => rfqs.id, { onDelete: 'cascade' }),
  product_name: varchar('product_name', { length: 255 }).notNull(),
  description: text('description'),
  quantity: decimal('quantity', { precision: 12, scale: 2 }).notNull(),
  unit: varchar('unit', { length: 50 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const rfq_attachments = pgTable('rfq_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfq_id: uuid('rfq_id').references(() => rfqs.id, { onDelete: 'cascade' }),
  file_name: varchar('file_name', { length: 255 }),
  file_url: text('file_url').notNull(),
  uploaded_by: uuid('uploaded_by').references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const rfq_vendors = pgTable('rfq_vendors', {
  rfq_id: uuid('rfq_id').references(() => rfqs.id, { onDelete: 'cascade' }).notNull(),
  vendor_id: uuid('vendor_id').references(() => vendors.id, { onDelete: 'cascade' }).notNull(),
  invited_at: timestamp('invited_at', { withTimezone: true }).defaultNow(),
  status: varchar('status', { length: 30 }).default('invited')
});

const quotations = pgTable('quotations', {
  id: uuid('id').defaultRandom().primaryKey(),
  rfq_id: uuid('rfq_id').references(() => rfqs.id).notNull(),
  vendor_id: uuid('vendor_id').references(() => vendors.id).notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  tax_rate: decimal('tax_rate', { precision: 5, scale: 2 }).default('18.00'),
  tax_amount: decimal('tax_amount', { precision: 15, scale: 2 }),
  total_amount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  delivery_days: integer('delivery_days').notNull(),
  validity_date: date('validity_date'),
  notes: text('notes'),
  status: varchar('status', { length: 30 }).default('submitted'),
  is_selected: boolean('is_selected').default(false),
  submitted_at: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const quotation_items = pgTable('quotation_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotation_id: uuid('quotation_id').references(() => quotations.id, { onDelete: 'cascade' }),
  rfq_item_id: uuid('rfq_item_id').references(() => rfq_items.id),
  product_name: varchar('product_name', { length: 255 }),
  quantity: decimal('quantity', { precision: 12, scale: 2 }),
  unit_price: decimal('unit_price', { precision: 15, scale: 2 }).notNull(),
  total_price: decimal('total_price', { precision: 15, scale: 2 }).notNull()
});

const approvals = pgTable('approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotation_id: uuid('quotation_id').references(() => quotations.id).notNull(),
  rfq_id: uuid('rfq_id').references(() => rfqs.id).notNull(),
  submitted_by: uuid('submitted_by').references(() => users.id).notNull(),
  assigned_to: uuid('assigned_to').references(() => users.id),
  status: varchar('status', { length: 30 }).default('pending'),
  remarks: text('remarks'),
  submitted_at: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  reviewed_at: timestamp('reviewed_at', { withTimezone: true }),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const purchase_orders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  po_number: varchar('po_number', { length: 50 }).notNull().unique(),
  rfq_id: uuid('rfq_id').references(() => rfqs.id),
  quotation_id: uuid('quotation_id').references(() => quotations.id).notNull(),
  approval_id: uuid('approval_id').references(() => approvals.id),
  vendor_id: uuid('vendor_id').references(() => vendors.id).notNull(),
  total_amount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  delivery_date: date('delivery_date'),
  status: varchar('status', { length: 30 }).default('issued'),
  created_by: uuid('created_by').references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  invoice_number: varchar('invoice_number', { length: 50 }).notNull().unique(),
  po_id: uuid('po_id').references(() => purchase_orders.id).notNull(),
  vendor_id: uuid('vendor_id').references(() => vendors.id).notNull(),
  subtotal: decimal('subtotal', { precision: 15, scale: 2 }).notNull(),
  tax_rate: decimal('tax_rate', { precision: 5, scale: 2 }).default('18.00'),
  tax_amount: decimal('tax_amount', { precision: 15, scale: 2 }).notNull(),
  total_amount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  status: varchar('status', { length: 30 }).default('generated'),
  due_date: date('due_date'),
  paid_at: timestamp('paid_at', { withTimezone: true }),
  created_by: uuid('created_by').references(() => users.id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow()
});

const activity_logs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entity_type: varchar('entity_type', { length: 50 }),
  entity_id: uuid('entity_id'),
  description: text('description'),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').references(() => users.id).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }),
  entity_id: uuid('entity_id'),
  is_read: boolean('is_read').default(false),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow()
});

module.exports = {
  vendors,
  users,
  rfqs,
  rfq_items,
  rfq_attachments,
  rfq_vendors,
  quotations,
  quotation_items,
  approvals,
  purchase_orders,
  invoices,
  activity_logs,
  notifications
};
