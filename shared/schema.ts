import { pgTable, text, serial, integer, boolean, timestamp, jsonb, real, date, primaryKey } from "drizzle-orm/pg-core";
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
  medicalHistory: text("medical_history"),
  dentalHistory: text("dental_history"),
  drugAllergy: text("drug_allergy"),
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
  prescriptionDate: date("prescription_date").notNull(), // Date the prescription was written
  timing: text("timing").notNull().default(""),
  days: integer("days").notNull().default(7), // Number of days the medication should be taken
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
  areaOfComplaint: text("area_of_complaint"),
  oralExamination: text("oral_examination"),
  toothNumber: text("tooth_number"),  // New field for tooth number
  investigation: text("investigation"),
  investigationalDiagnosis: text("investigational_diagnosis"), // New field for investigation diagnosis
  treatmentPlan: text("treatment_plan"),
  prescription: text("prescription"), // Legacy field, will eventually store a reference to prescriptions table
  treatmentDone: text("treatment_done"),
  advice: text("advice"),
  notes: text("notes"),
  nextAppointment: date("next_appointment"),
  attachments: jsonb("attachments"),
  consentForms: jsonb("consent_forms"),
  previousVisitId: integer("previous_visit_id"), // Reference to parent visit (for follow-ups)
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
  shade: text("shade"),
  units: integer("units").default(1).notNull(),  // Number of units (e.g., 2 crowns)
  labCost: real("lab_cost"),                     // Cost paid to the lab (per unit)
  clinicCost: real("clinic_cost"),               // Cost charged to patient (per unit)
  totalLabCost: real("total_lab_cost"),          // Total lab cost (labCost * units)
  totalClinicCost: real("total_clinic_cost"),    // Total clinic cost (clinicCost * units)
  paymentStatus: text("payment_status").default("pending").notNull(), // "paid" or "pending"
  paymentDate: date("payment_date"),             // When the lab was paid
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

// Table to store default costs for lab work types and technicians
export const labWorkCosts = pgTable("lab_work_costs", {
  id: serial("id").primaryKey(),
  workType: text("work_type").notNull(),  // The type of lab work (e.g., "Crown", "Bridge")
  labTechnician: text("lab_technician").notNull(),  // The name of the technician
  cost: real("cost").notNull(),  // Cost charged by this technician for this work type
  notes: text("notes"),
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
  paidAmount: real("paid_amount").default(0),
  balanceAmount: real("balance_amount").default(0),
  status: text("status").notNull(),
  paymentMethod: text("payment_method"),
  paymentDate: date("payment_date"),
  notes: text("notes"),
});

export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
});

// Appointments
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id")
    .notNull()
    .references(() => patients.patientId),
  date: date("date").notNull(),
  doctorName: text("doctor_name"),
  treatmentDone: text("treatment_done"),
  notes: text("notes"),
  attachments: jsonb("attachments"),
  consentForms: jsonb("consent_forms"),
  visitId: integer("visit_id").references(() => patientVisits.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
});

// Dental examination tables
export const toothFindings = pgTable("tooth_findings", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  toothNumber: text("tooth_number").notNull(),
  finding: text("finding").notNull(),
});

export const generalizedFindings = pgTable("generalized_findings", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  finding: text("finding").notNull(),
});

export const investigations = pgTable("investigations", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  type: text("type").notNull(),
  findings: text("findings"),
});

export const followUps = pgTable("follow_ups", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id").notNull(),
  patientId: text("patient_id").notNull(),
  scheduledDate: date("scheduled_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").default("scheduled").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Settings schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: jsonb("setting_value").notNull(),
  category: text("category").notNull(),
});

// Doctor signatures
export const doctorSignatures = pgTable("doctor_signatures", {
  id: serial("id").primaryKey(),
  doctorName: text("doctor_name").notNull().unique(),
  signatureImage: text("signature_image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPatientSchema = createInsertSchema(patients).omit({ id: true, createdAt: true });
export const insertPatientVisitSchema = createInsertSchema(patientVisits).omit({ id: true });
export const insertLabWorkSchema = createInsertSchema(labWorks).omit({ id: true });
export const insertLabInventorySchema = createInsertSchema(labInventory).omit({ id: true });
export const insertLabWorkCostSchema = createInsertSchema(labWorkCosts).omit({ id: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertStaffAttendanceSchema = createInsertSchema(staffAttendance).omit({ id: true });
export const insertStaffSalarySchema = createInsertSchema(staffSalary).omit({ id: true });
export const insertInvoiceSchema = createInsertSchema(invoices).omit({ id: true });
export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({ id: true });
export const insertSettingSchema = createInsertSchema(settings).omit({ id: true });
export const insertMedicationSchema = createInsertSchema(medications).omit({ id: true });
export const insertPrescriptionSchema = createInsertSchema(prescriptions).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export const insertToothFindingSchema = createInsertSchema(toothFindings).omit({ id: true });
export const insertGeneralizedFindingSchema = createInsertSchema(generalizedFindings).omit({ id: true });
export const insertInvestigationSchema = createInsertSchema(investigations).omit({ id: true });
export const insertFollowUpSchema = createInsertSchema(followUps).omit({ id: true, createdAt: true });
export const insertDoctorSignatureSchema = createInsertSchema(doctorSignatures).omit({ id: true, createdAt: true });

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

export type LabWorkCost = typeof labWorkCosts.$inferSelect;
export type InsertLabWorkCost = z.infer<typeof insertLabWorkCostSchema>;

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

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type ToothFinding = typeof toothFindings.$inferSelect;
export type InsertToothFinding = z.infer<typeof insertToothFindingSchema>;

export type GeneralizedFinding = typeof generalizedFindings.$inferSelect;
export type InsertGeneralizedFinding = z.infer<typeof insertGeneralizedFindingSchema>;

export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = z.infer<typeof insertInvestigationSchema>;

export type FollowUp = typeof followUps.$inferSelect;
export type InsertFollowUp = z.infer<typeof insertFollowUpSchema>;

export type DoctorSignature = typeof doctorSignatures.$inferSelect;
export type InsertDoctorSignature = z.infer<typeof insertDoctorSignatureSchema>;
