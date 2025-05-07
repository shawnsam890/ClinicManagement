import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User related schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("staff"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patient related schemas
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  sex: text("sex").notNull(),
  address: text("address").notNull(),
  phoneNumber: text("phone_number").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Medications table
export const medications = pgTable("medications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  quantity: integer("quantity").default(0),
  threshold: integer("threshold").default(10),
  notes: text("notes"),
});

// Prescriptions table to store medication prescriptions
export const prescriptions = pgTable("prescriptions", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  medicationId: integer("medication_id").notNull(),
  slNo: integer("sl_no").notNull(),
  beforeAfterFood: text("before_after_food").default("after"),
  morning: text("morning").default("-"),
  afternoon: text("afternoon").default("-"),
  evening: text("evening").default("-"),
  night: text("night").default("-"),
  duration: text("duration"),
  notes: text("notes"),
});

export const patientVisits = pgTable("patient_visits", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  date: date("date").notNull(),
  medicalHistory: text("medical_history"),
  drugAllergy: text("drug_allergy"),
  previousDentalHistory: text("previous_dental_history"),
  chiefComplaint: text("chief_complaint").notNull(),
  oralExamination: text("oral_examination"),
  investigation: text("investigation"),
  treatmentPlan: text("treatment_plan"),
  prescription: text("prescription"), // Legacy field, will eventually store a reference to prescriptions table
  treatmentDone: text("treatment_done"),
  advice: text("advice"),
  notes: text("notes"),
  nextAppointment: date("next_appointment"),
  attachments: jsonb("attachments"),
  consentForms: jsonb("consent_forms"),
});

// Lab related schemas
export const labWorks = pgTable("lab_works", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  workType: text("work_type").notNull(),
  status: text("status").notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  dueDate: date("due_date").notNull(),
  completedDate: date("completed_date"),
  technician: text("technician"),
  cost: real("cost"),
  notes: text("notes"),
});

export const labInventory = pgTable("lab_inventory", {
  id: serial("id").primaryKey(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  threshold: integer("threshold"),
  unitCost: real("unit_cost"),
  supplier: text("supplier"),
  lastRestock: date("last_restock"),
});

// Staff related schemas
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  contactInfo: text("contact_info").notNull(),
  address: text("address"),
  joinDate: date("join_date").notNull(),
  salary: real("salary").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
});

export const staffAttendance = pgTable("staff_attendance", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  date: date("date").notNull(),
  present: boolean("present").notNull(),
  remarks: text("remarks"),
});

export const staffSalary = pgTable("staff_salary", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  month: text("month").notNull(),
  year: integer("year").notNull(),
  baseSalary: real("base_salary").notNull(),
  bonus: real("bonus").default(0),
  deduction: real("deduction").default(0),
  netAmount: real("net_amount").notNull(),
  paymentDate: date("payment_date"),
  paymentStatus: text("payment_status").notNull(),
  notes: text("notes"),
});

// Invoice related schemas
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull(),
  visitId: integer("visit_id"),
  date: date("date").notNull(),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull(),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  item: text("item").notNull(),
  description: text("description"),
  amount: real("amount").notNull(),
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  category: text("category").notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertPatientVisitSchema = createInsertSchema(patientVisits).omit({ id: true });
export const insertLabWorkSchema = createInsertSchema(labWorks).omit({ id: true });
export const insertLabInventorySchema = createInsertSchema(labInventory).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertStaffAttendanceSchema = createInsertSchema(staffAttendance).omit({ id: true });
export const insertStaffSalarySchema = createInsertSchema(staffSalary).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true });

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type PatientVisit = typeof patientVisits.$inferSelect;
export type InsertPatientVisit = z.infer<typeof insertPatientVisitSchema>;

export type LabWork = typeof labWorks.$inferSelect;
export type InsertLabWork = z.infer<typeof insertLabWorkSchema>;

export type LabInventoryItem = typeof labInventory.$inferSelect;
export type InsertLabInventoryItem = z.infer<typeof insertLabInventorySchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type StaffAttendance = typeof staffAttendance.$inferSelect;
export type InsertStaffAttendance = z.infer<typeof insertStaffAttendanceSchema>;

export type StaffSalary = typeof staffSalary.$inferSelect;
export type InsertStaffSalary = z.infer<typeof insertStaffSalarySchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

export type Medication = typeof medications.$inferSelect;
export type InsertMedication = z.infer<typeof insertMedicationSchema>;

export type Prescription = typeof prescriptions.$inferSelect;
export type InsertPrescription = z.infer<typeof insertPrescriptionSchema>;
