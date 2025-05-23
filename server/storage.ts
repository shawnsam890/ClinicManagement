import {
  Patient, InsertPatient,
  PatientVisit, InsertPatientVisit,
  Appointment, InsertAppointment,
  LabWork, InsertLabWork,
  LabInventoryItem, InsertLabInventoryItem,
  LabWorkCost, InsertLabWorkCost,
  Staff, InsertStaff,
  StaffAttendance, InsertStaffAttendance,
  StaffSalary, InsertStaffSalary,
  Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem,
  Setting, InsertSetting,
  Medication, InsertMedication,
  Prescription, InsertPrescription,
  ToothFinding, InsertToothFinding,
  GeneralizedFinding, InsertGeneralizedFinding,
  Investigation, InsertInvestigation,
  FollowUp, InsertFollowUp
} from "@shared/schema";
export interface IStorage {
  // Patient management
  getPatients(): Promise<Patient[]>;
  getPatientById(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;
  
  // Patient visits
  getPatientVisits(patientId: string): Promise<PatientVisit[]>;
  getPatientVisitById(id: number): Promise<PatientVisit | undefined>;
  createPatientVisit(visit: InsertPatientVisit): Promise<PatientVisit>;
  updatePatientVisit(id: number, visit: Partial<InsertPatientVisit>): Promise<PatientVisit | undefined>;
  deletePatientVisit(id: number): Promise<boolean>;
  
  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointmentById(id: number): Promise<Appointment | undefined>;
  getAppointmentsByPatientId(patientId: string): Promise<Appointment[]>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Lab management
  getLabWorks(): Promise<LabWork[]>;
  getLabWorkById(id: number): Promise<LabWork | undefined>;
  getLabWorksByPatientId(patientId: string): Promise<LabWork[]>;
  createLabWork(labWork: InsertLabWork): Promise<LabWork>;
  updateLabWork(id: number, labWork: Partial<InsertLabWork>): Promise<LabWork | undefined>;
  deleteLabWork(id: number): Promise<boolean>;
  
  // Lab work costs
  getLabWorkCosts(): Promise<LabWorkCost[]>;
  getLabWorkCostById(id: number): Promise<LabWorkCost | undefined>;
  getLabWorkCostByWorkType(workType: string): Promise<LabWorkCost | undefined>;
  getLabWorkCostByWorkTypeAndTechnician(workType: string, labTechnician: string): Promise<LabWorkCost | undefined>;
  createLabWorkCost(labWorkCost: InsertLabWorkCost): Promise<LabWorkCost>;
  updateLabWorkCost(id: number, labWorkCost: Partial<InsertLabWorkCost>): Promise<LabWorkCost | undefined>;
  deleteLabWorkCost(id: number): Promise<boolean>;
  
  // Lab inventory
  getLabInventory(): Promise<LabInventoryItem[]>;
  getLabInventoryItemById(id: number): Promise<LabInventoryItem | undefined>;
  createLabInventoryItem(item: InsertLabInventoryItem): Promise<LabInventoryItem>;
  updateLabInventoryItem(id: number, item: Partial<InsertLabInventoryItem>): Promise<LabInventoryItem | undefined>;
  deleteLabInventoryItem(id: number): Promise<boolean>;
  
  // Staff management
  getStaff(): Promise<Staff[]>;
  getStaffById(id: number): Promise<Staff | undefined>;
  createStaff(staff: InsertStaff): Promise<Staff>;
  updateStaff(id: number, staff: Partial<InsertStaff>): Promise<Staff | undefined>;
  deleteStaff(id: number): Promise<boolean>;
  
  // Staff attendance
  getStaffAttendance(staffId: number): Promise<StaffAttendance[]>;
  getStaffAttendanceById(id: number): Promise<StaffAttendance | undefined>;
  createStaffAttendance(attendance: InsertStaffAttendance): Promise<StaffAttendance>;
  updateStaffAttendance(id: number, attendance: Partial<InsertStaffAttendance>): Promise<StaffAttendance | undefined>;
  deleteStaffAttendance(id: number): Promise<boolean>;
  
  // Staff salary
  getStaffSalary(staffId: number): Promise<StaffSalary[]>;
  getStaffSalaryById(id: number): Promise<StaffSalary | undefined>;
  createStaffSalary(salary: InsertStaffSalary): Promise<StaffSalary>;
  updateStaffSalary(id: number, salary: Partial<InsertStaffSalary>): Promise<StaffSalary | undefined>;
  deleteStaffSalary(id: number): Promise<boolean>;
  
  // Invoice management
  getInvoices(): Promise<Invoice[]>;
  getInvoiceById(id: number): Promise<Invoice | undefined>;
  getInvoicesByPatientId(patientId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Invoice items
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  getInvoiceItemById(id: number): Promise<InvoiceItem | undefined>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined>;
  deleteInvoiceItem(id: number): Promise<boolean>;
  
  // Medication management
  getMedications(): Promise<Medication[]>;
  getMedicationById(id: number): Promise<Medication | undefined>;
  getMedicationByName(name: string): Promise<Medication | undefined>;
  createMedication(medication: InsertMedication): Promise<Medication>;
  updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined>;
  deleteMedication(id: number): Promise<boolean>;
  
  // Prescription management
  getPrescriptions(visitId: number): Promise<Prescription[]>;
  getPrescriptionById(id: number): Promise<Prescription | undefined>;
  createPrescription(prescription: InsertPrescription): Promise<Prescription>;
  updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined>;
  deletePrescription(id: number): Promise<boolean>;
  
  // Settings
  getSettings(): Promise<Setting[]>;
  getSettingsByCategory(category: string): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(id: number, setting: Partial<InsertSetting>): Promise<Setting | undefined>;
  deleteSetting(id: number): Promise<boolean>;
  
  // Tooth findings
  getToothFindings(visitId: number): Promise<ToothFinding[]>;
  getToothFindingById(id: number): Promise<ToothFinding | undefined>;
  createToothFinding(finding: InsertToothFinding): Promise<ToothFinding>;
  updateToothFinding(id: number, finding: Partial<InsertToothFinding>): Promise<ToothFinding | undefined>;
  deleteToothFinding(id: number): Promise<boolean>;
  
  // Generalized findings
  getGeneralizedFindings(visitId: number): Promise<GeneralizedFinding[]>;
  getGeneralizedFindingById(id: number): Promise<GeneralizedFinding | undefined>;
  createGeneralizedFinding(finding: InsertGeneralizedFinding): Promise<GeneralizedFinding>;
  updateGeneralizedFinding(id: number, finding: Partial<InsertGeneralizedFinding>): Promise<GeneralizedFinding | undefined>;
  deleteGeneralizedFinding(id: number): Promise<boolean>;
  
  // Investigations
  getInvestigations(visitId: number): Promise<Investigation[]>;
  getInvestigationById(id: number): Promise<Investigation | undefined>;
  createInvestigation(investigation: InsertInvestigation): Promise<Investigation>;
  updateInvestigation(id: number, investigation: Partial<InsertInvestigation>): Promise<Investigation | undefined>;
  deleteInvestigation(id: number): Promise<boolean>;
  
  // Follow-ups
  getFollowUps(visitId: number): Promise<FollowUp[]>;
  getFollowUpById(id: number): Promise<FollowUp | undefined>;
  createFollowUp(followUp: InsertFollowUp): Promise<FollowUp>;
  updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined>;
  deleteFollowUp(id: number): Promise<boolean>;
  
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private patients: Map<number, Patient>;
  private patientVisits: Map<number, PatientVisit>;
  private appointments: Map<number, Appointment>;
  private labWorks: Map<number, LabWork>;
  private labInventory: Map<number, LabInventoryItem>;
  private staffMembers: Map<number, Staff>;
  private staffAttendance: Map<number, StaffAttendance>;
  private staffSalaries: Map<number, StaffSalary>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private settings: Map<number, Setting>;
  private medications: Map<number, Medication>;
  private prescriptions: Map<number, Prescription>;
  private toothFindings: Map<number, ToothFinding>;
  private generalizedFindings: Map<number, GeneralizedFinding>;
  private investigations: Map<number, Investigation>;
  private followUps: Map<number, FollowUp>;
  
  private patientIdCounter: number;
  private visitIdCounter: number;
  private appointmentIdCounter: number;
  private labWorkIdCounter: number;
  private labInventoryIdCounter: number;
  private staffIdCounter: number;
  private attendanceIdCounter: number;
  private salaryIdCounter: number;
  private invoiceIdCounter: number;
  private invoiceItemIdCounter: number;
  private settingIdCounter: number;
  private medicationIdCounter: number;
  private prescriptionIdCounter: number;
  private toothFindingIdCounter: number;
  private generalizedFindingIdCounter: number;
  private investigationIdCounter: number;
  private followUpIdCounter: number;
  
  constructor() {
    this.patients = new Map();
    this.patientVisits = new Map();
    this.appointments = new Map();
    this.labWorks = new Map();
    this.labInventory = new Map();
    this.staffMembers = new Map();
    this.staffAttendance = new Map();
    this.staffSalaries = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.settings = new Map();
    this.medications = new Map();
    this.prescriptions = new Map();
    this.toothFindings = new Map();
    this.generalizedFindings = new Map();
    this.investigations = new Map();
    this.followUps = new Map();
    
    this.patientIdCounter = 1;
    this.visitIdCounter = 1;
    this.appointmentIdCounter = 1;
    this.labWorkIdCounter = 1;
    this.labInventoryIdCounter = 1;
    this.staffIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.salaryIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.invoiceItemIdCounter = 1;
    this.settingIdCounter = 1;
    this.medicationIdCounter = 1;
    this.prescriptionIdCounter = 1;
    this.toothFindingIdCounter = 1;
    this.generalizedFindingIdCounter = 1;
    this.investigationIdCounter = 1;
    this.followUpIdCounter = 1;
    
    // Initialize with default settings
    this.initializeDefaultSettings();
  }
  
  private initializeDefaultSettings() {
    // Add default dropdown options
    this.createSetting({
      settingKey: 'dropdown_options',
      settingValue: {
        medicalHistory: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'None'],
        drugAllergy: ['Penicillin', 'NSAIDs', 'Sulfa Drugs', 'Local Anesthetics', 'None'],
        previousDentalHistory: ['Extraction', 'Root Canal Treatment', 'Filling', 'Crown', 'Implant', 'None'],
        chiefComplaint: ['Toothache', 'Tooth Sensitivity', 'Bleeding Gums', 'Bad Breath', 'Broken Tooth', 'Jaw Pain'],
        oralExamination: ['Cavity', 'Gingivitis', 'Periodontitis', 'Abscess', 'Fractured Tooth'],
        investigation: ['X-Ray', 'CBCT', 'Pulp Testing', 'Blood Test', 'None'],
        treatmentPlan: ['Filling', 'Extraction', 'Root Canal', 'Scaling', 'Crown', 'Implant'],
        prescription: ['Antibiotics', 'Painkillers', 'Anti-inflammatory', 'Mouthwash', 'None'],
        treatmentDone: ['Filling', 'Extraction', 'Root Canal', 'Scaling', 'Crown', 'Consultation Only'],
        advice: ['Soft Diet', 'Maintain Oral Hygiene', 'Avoid Hot Food/Beverage', 'Follow-up Required', 'None'],
        labTechnicians: ['Dr. Smith', 'Dr. Johnson', 'Dr. Patel'],
        workTypes: ['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Night Guard', 'Other'],
        crownShades: ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4']
      },
      category: 'dropdown_options'
    });
    
    // Add clinic info settings
    this.createSetting({
      settingKey: 'clinic_info',
      settingValue: {
        name: "Dr. Shawn's Clinic",
        logo: "",
        address: "",
        phone: "",
        email: ""
      },
      category: 'clinic_info'
    });
    
    // Add patient ID format setting
    this.createSetting({
      settingKey: 'patient_id_format',
      settingValue: {
        prefix: 'PT',
        yearInFormat: true,
        digitCount: 4,
        separator: '-'
      },
      category: 'patient_id_format'
    });
  }
  
  // Patient management
  async getPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values());
  }
  
  async getPatientById(id: number): Promise<Patient | undefined> {
    return this.patients.get(id);
  }
  
  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    return Array.from(this.patients.values()).find(patient => patient.patientId === patientId);
  }
  
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const id = this.patientIdCounter++;
    const newPatient: Patient = { ...patient, id, createdAt: new Date() };
    this.patients.set(id, newPatient);
    return newPatient;
  }
  
  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const existingPatient = this.patients.get(id);
    if (!existingPatient) return undefined;
    
    const updatedPatient = { ...existingPatient, ...patient };
    this.patients.set(id, updatedPatient);
    return updatedPatient;
  }
  
  async deletePatient(id: number): Promise<boolean> {
    return this.patients.delete(id);
  }
  
  // Patient visits
  async getPatientVisits(patientId: string): Promise<PatientVisit[]> {
    return Array.from(this.patientVisits.values()).filter(visit => visit.patientId === patientId);
  }
  
  async getPatientVisitById(id: number): Promise<PatientVisit | undefined> {
    return this.patientVisits.get(id);
  }
  
  async createPatientVisit(visit: InsertPatientVisit): Promise<PatientVisit> {
    const id = this.visitIdCounter++;
    const newVisit: PatientVisit = { ...visit, id };
    this.patientVisits.set(id, newVisit);
    return newVisit;
  }
  
  async updatePatientVisit(id: number, visit: Partial<InsertPatientVisit>): Promise<PatientVisit | undefined> {
    const existingVisit = this.patientVisits.get(id);
    if (!existingVisit) return undefined;
    
    const updatedVisit = { ...existingVisit, ...visit };
    this.patientVisits.set(id, updatedVisit);
    return updatedVisit;
  }
  
  async deletePatientVisit(id: number): Promise<boolean> {
    return this.patientVisits.delete(id);
  }
  
  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }
  
  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }
  
  async getAppointmentsByPatientId(patientId: string): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => appointment.patientId === patientId);
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentIdCounter++;
    const newAppointment: Appointment = { ...appointment, id };
    this.appointments.set(id, newAppointment);
    return newAppointment;
  }
  
  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;
    
    const updatedAppointment = { ...existingAppointment, ...appointment };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }
  
  // Lab management
  async getLabWorks(): Promise<LabWork[]> {
    return Array.from(this.labWorks.values());
  }
  
  async getLabWorkById(id: number): Promise<LabWork | undefined> {
    return this.labWorks.get(id);
  }
  
  async getLabWorksByPatientId(patientId: string): Promise<LabWork[]> {
    return Array.from(this.labWorks.values()).filter(work => work.patientId === patientId);
  }
  
  async createLabWork(labWork: InsertLabWork): Promise<LabWork> {
    const id = this.labWorkIdCounter++;
    const newLabWork: LabWork = { ...labWork, id };
    this.labWorks.set(id, newLabWork);
    return newLabWork;
  }
  
  async updateLabWork(id: number, labWork: Partial<InsertLabWork>): Promise<LabWork | undefined> {
    const existingLabWork = this.labWorks.get(id);
    if (!existingLabWork) return undefined;
    
    const updatedLabWork = { ...existingLabWork, ...labWork };
    this.labWorks.set(id, updatedLabWork);
    return updatedLabWork;
  }
  
  async deleteLabWork(id: number): Promise<boolean> {
    return this.labWorks.delete(id);
  }
  
  // Lab inventory
  async getLabInventory(): Promise<LabInventoryItem[]> {
    return Array.from(this.labInventory.values());
  }
  
  async getLabInventoryItemById(id: number): Promise<LabInventoryItem | undefined> {
    return this.labInventory.get(id);
  }
  
  async createLabInventoryItem(item: InsertLabInventoryItem): Promise<LabInventoryItem> {
    const id = this.labInventoryIdCounter++;
    const newItem: LabInventoryItem = { ...item, id };
    this.labInventory.set(id, newItem);
    return newItem;
  }
  
  async updateLabInventoryItem(id: number, item: Partial<InsertLabInventoryItem>): Promise<LabInventoryItem | undefined> {
    const existingItem = this.labInventory.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.labInventory.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteLabInventoryItem(id: number): Promise<boolean> {
    return this.labInventory.delete(id);
  }
  
  // Staff management
  async getStaff(): Promise<Staff[]> {
    return Array.from(this.staffMembers.values());
  }
  
  async getStaffById(id: number): Promise<Staff | undefined> {
    return this.staffMembers.get(id);
  }
  
  async createStaff(staff: InsertStaff): Promise<Staff> {
    const id = this.staffIdCounter++;
    const newStaff: Staff = { ...staff, id };
    this.staffMembers.set(id, newStaff);
    return newStaff;
  }
  
  async updateStaff(id: number, staff: Partial<InsertStaff>): Promise<Staff | undefined> {
    const existingStaff = this.staffMembers.get(id);
    if (!existingStaff) return undefined;
    
    const updatedStaff = { ...existingStaff, ...staff };
    this.staffMembers.set(id, updatedStaff);
    return updatedStaff;
  }
  
  async deleteStaff(id: number): Promise<boolean> {
    return this.staffMembers.delete(id);
  }
  
  // Staff attendance
  async getStaffAttendance(staffId: number): Promise<StaffAttendance[]> {
    return Array.from(this.staffAttendance.values()).filter(attendance => attendance.staffId === staffId);
  }
  
  async getStaffAttendanceById(id: number): Promise<StaffAttendance | undefined> {
    return this.staffAttendance.get(id);
  }
  
  async createStaffAttendance(attendance: InsertStaffAttendance): Promise<StaffAttendance> {
    const id = this.attendanceIdCounter++;
    const newAttendance: StaffAttendance = { ...attendance, id };
    this.staffAttendance.set(id, newAttendance);
    return newAttendance;
  }
  
  async updateStaffAttendance(id: number, attendance: Partial<InsertStaffAttendance>): Promise<StaffAttendance | undefined> {
    const existingAttendance = this.staffAttendance.get(id);
    if (!existingAttendance) return undefined;
    
    const updatedAttendance = { ...existingAttendance, ...attendance };
    this.staffAttendance.set(id, updatedAttendance);
    return updatedAttendance;
  }
  
  async deleteStaffAttendance(id: number): Promise<boolean> {
    return this.staffAttendance.delete(id);
  }
  
  // Staff salary
  async getStaffSalary(staffId: number): Promise<StaffSalary[]> {
    return Array.from(this.staffSalaries.values()).filter(salary => salary.staffId === staffId);
  }
  
  async getStaffSalaryById(id: number): Promise<StaffSalary | undefined> {
    return this.staffSalaries.get(id);
  }
  
  async createStaffSalary(salary: InsertStaffSalary): Promise<StaffSalary> {
    const id = this.salaryIdCounter++;
    const newSalary: StaffSalary = { ...salary, id };
    this.staffSalaries.set(id, newSalary);
    return newSalary;
  }
  
  async updateStaffSalary(id: number, salary: Partial<InsertStaffSalary>): Promise<StaffSalary | undefined> {
    const existingSalary = this.staffSalaries.get(id);
    if (!existingSalary) return undefined;
    
    const updatedSalary = { ...existingSalary, ...salary };
    this.staffSalaries.set(id, updatedSalary);
    return updatedSalary;
  }
  
  async deleteStaffSalary(id: number): Promise<boolean> {
    return this.staffSalaries.delete(id);
  }
  
  // Invoice management
  async getInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }
  
  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
  
  async getInvoicesByPatientId(patientId: string): Promise<Invoice[]> {
    return Array.from(this.invoices.values()).filter(invoice => invoice.patientId === patientId);
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.invoiceIdCounter++;
    const newInvoice: Invoice = { ...invoice, id };
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const existingInvoice = this.invoices.get(id);
    if (!existingInvoice) return undefined;
    
    const updatedInvoice = { ...existingInvoice, ...invoice };
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    return this.invoices.delete(id);
  }
  
  // Invoice items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
  }
  
  async getInvoiceItemById(id: number): Promise<InvoiceItem | undefined> {
    return this.invoiceItems.get(id);
  }
  
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const id = this.invoiceItemIdCounter++;
    const newItem: InvoiceItem = { ...item, id };
    this.invoiceItems.set(id, newItem);
    return newItem;
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const existingItem = this.invoiceItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.invoiceItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteInvoiceItem(id: number): Promise<boolean> {
    return this.invoiceItems.delete(id);
  }
  
  // Settings
  async getSettings(): Promise<Setting[]> {
    return Array.from(this.settings.values());
  }
  
  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return Array.from(this.settings.values()).filter(setting => setting.category === category);
  }
  
  async getSettingByKey(key: string): Promise<Setting | undefined> {
    return Array.from(this.settings.values()).find(setting => setting.settingKey === key);
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    const id = this.settingIdCounter++;
    const newSetting: Setting = { ...setting, id };
    this.settings.set(id, newSetting);
    return newSetting;
  }
  
  async updateSetting(id: number, setting: Partial<InsertSetting>): Promise<Setting | undefined> {
    const existingSetting = this.settings.get(id);
    if (!existingSetting) return undefined;
    
    const updatedSetting = { ...existingSetting, ...setting };
    this.settings.set(id, updatedSetting);
    return updatedSetting;
  }
  
  async deleteSetting(id: number): Promise<boolean> {
    return this.settings.delete(id);
  }
}

import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, asc } from "drizzle-orm";
import { pool } from "./db";
import { users, patients, patientVisits, appointments, labWorks, labInventory, labWorkCosts, staff, 
  staffAttendance, staffSalary, invoices, invoiceItems, settings,
  medications, prescriptions, toothFindings, generalizedFindings, 
  investigations, followUps } from "@shared/schema";

const PostgresSessionStore = connectPg(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }
  
  // Patient management
  async getPatients(): Promise<Patient[]> {
    return await db.select().from(patients).orderBy(asc(patients.id));
  }
  
  async getPatientById(id: number): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id));
    return result[0];
  }
  
  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.patientId, patientId));
    return result[0];
  }
  
  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values({
      ...patient,
      createdAt: new Date()
    }).returning();
    return result[0];
  }
  
  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    const result = await db.update(patients)
      .set(patient)
      .where(eq(patients.id, id))
      .returning();
    return result[0];
  }
  
  async deletePatient(id: number): Promise<boolean> {
    const result = await db.delete(patients).where(eq(patients.id, id));
    return true;
  }
  
  // Patient visits
  async getPatientVisits(patientId: string): Promise<PatientVisit[]> {
    return await db.select().from(patientVisits).where(eq(patientVisits.patientId, patientId));
  }
  
  async getPatientVisitById(id: number): Promise<PatientVisit | undefined> {
    const result = await db.select().from(patientVisits).where(eq(patientVisits.id, id));
    return result[0];
  }
  
  async createPatientVisit(visit: InsertPatientVisit): Promise<PatientVisit> {
    const result = await db.insert(patientVisits).values(visit).returning();
    return result[0];
  }
  
  async updatePatientVisit(id: number, visit: Partial<InsertPatientVisit>): Promise<PatientVisit | undefined> {
    const result = await db.update(patientVisits)
      .set(visit)
      .where(eq(patientVisits.id, id))
      .returning();
    return result[0];
  }
  
  async deletePatientVisit(id: number): Promise<boolean> {
    await db.delete(patientVisits).where(eq(patientVisits.id, id));
    return true;
  }
  
  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return await db.select().from(appointments);
  }
  
  async getAppointmentById(id: number): Promise<Appointment | undefined> {
    const result = await db.select().from(appointments).where(eq(appointments.id, id));
    return result[0];
  }
  
  async getAppointmentsByPatientId(patientId: string): Promise<Appointment[]> {
    return await db.select().from(appointments).where(eq(appointments.patientId, patientId));
  }
  
  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    const result = await db.insert(appointments).values(appointment).returning();
    return result[0];
  }
  
  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const result = await db.update(appointments)
      .set(appointment)
      .where(eq(appointments.id, id))
      .returning();
    return result[0];
  }
  
  async deleteAppointment(id: number): Promise<boolean> {
    await db.delete(appointments).where(eq(appointments.id, id));
    return true;
  }
  
  // Lab management
  async getLabWorks(): Promise<LabWork[]> {
    return await db.select().from(labWorks);
  }
  
  async getLabWorkById(id: number): Promise<LabWork | undefined> {
    const result = await db.select().from(labWorks).where(eq(labWorks.id, id));
    return result[0];
  }
  
  async getLabWorksByPatientId(patientId: string): Promise<LabWork[]> {
    return await db.select().from(labWorks).where(eq(labWorks.patientId, patientId));
  }
  
  async createLabWork(labWork: InsertLabWork): Promise<LabWork> {
    const result = await db.insert(labWorks).values(labWork).returning();
    return result[0];
  }
  
  async updateLabWork(id: number, labWork: Partial<InsertLabWork>): Promise<LabWork | undefined> {
    const result = await db.update(labWorks)
      .set(labWork)
      .where(eq(labWorks.id, id))
      .returning();
    return result[0];
  }
  
  async deleteLabWork(id: number): Promise<boolean> {
    await db.delete(labWorks).where(eq(labWorks.id, id));
    return true;
  }
  
  // Lab work costs
  async getLabWorkCosts(): Promise<LabWorkCost[]> {
    return await db.select().from(labWorkCosts);
  }
  
  async getLabWorkCostById(id: number): Promise<LabWorkCost | undefined> {
    const result = await db.select().from(labWorkCosts).where(eq(labWorkCosts.id, id));
    return result[0];
  }
  
  async getLabWorkCostByWorkType(workType: string): Promise<LabWorkCost | undefined> {
    const result = await db.select().from(labWorkCosts).where(eq(labWorkCosts.workType, workType));
    return result[0];
  }
  
  async getLabWorkCostByWorkTypeAndTechnician(workType: string, labTechnician: string): Promise<LabWorkCost | undefined> {
    const result = await db.select().from(labWorkCosts)
      .where(and(
        eq(labWorkCosts.workType, workType),
        eq(labWorkCosts.labTechnician, labTechnician)
      ));
    return result[0];
  }
  
  async createLabWorkCost(labWorkCost: InsertLabWorkCost): Promise<LabWorkCost> {
    const result = await db.insert(labWorkCosts).values(labWorkCost).returning();
    return result[0];
  }
  
  async updateLabWorkCost(id: number, labWorkCost: Partial<InsertLabWorkCost>): Promise<LabWorkCost | undefined> {
    const result = await db.update(labWorkCosts)
      .set(labWorkCost)
      .where(eq(labWorkCosts.id, id))
      .returning();
    return result[0];
  }
  
  async deleteLabWorkCost(id: number): Promise<boolean> {
    await db.delete(labWorkCosts).where(eq(labWorkCosts.id, id));
    return true;
  }
  
  // Lab inventory
  async getLabInventory(): Promise<LabInventoryItem[]> {
    return await db.select().from(labInventory);
  }
  
  async getLabInventoryItemById(id: number): Promise<LabInventoryItem | undefined> {
    const result = await db.select().from(labInventory).where(eq(labInventory.id, id));
    return result[0];
  }
  
  async createLabInventoryItem(item: InsertLabInventoryItem): Promise<LabInventoryItem> {
    const result = await db.insert(labInventory).values(item).returning();
    return result[0];
  }
  
  async updateLabInventoryItem(id: number, item: Partial<InsertLabInventoryItem>): Promise<LabInventoryItem | undefined> {
    const result = await db.update(labInventory)
      .set(item)
      .where(eq(labInventory.id, id))
      .returning();
    return result[0];
  }
  
  async deleteLabInventoryItem(id: number): Promise<boolean> {
    await db.delete(labInventory).where(eq(labInventory.id, id));
    return true;
  }
  
  // Staff management
  async getStaff(): Promise<Staff[]> {
    return await db.select().from(staff);
  }
  
  async getStaffById(id: number): Promise<Staff | undefined> {
    const result = await db.select().from(staff).where(eq(staff.id, id));
    return result[0];
  }
  
  async createStaff(staffMember: InsertStaff): Promise<Staff> {
    const result = await db.insert(staff).values(staffMember).returning();
    return result[0];
  }
  
  async updateStaff(id: number, staffMember: Partial<InsertStaff>): Promise<Staff | undefined> {
    const result = await db.update(staff)
      .set(staffMember)
      .where(eq(staff.id, id))
      .returning();
    return result[0];
  }
  
  async deleteStaff(id: number): Promise<boolean> {
    await db.delete(staff).where(eq(staff.id, id));
    return true;
  }
  
  // Staff attendance
  async getStaffAttendance(staffId: number): Promise<StaffAttendance[]> {
    return await db.select().from(staffAttendance).where(eq(staffAttendance.staffId, staffId));
  }
  
  async getStaffAttendanceById(id: number): Promise<StaffAttendance | undefined> {
    const result = await db.select().from(staffAttendance).where(eq(staffAttendance.id, id));
    return result[0];
  }
  
  async createStaffAttendance(attendance: InsertStaffAttendance): Promise<StaffAttendance> {
    const result = await db.insert(staffAttendance).values(attendance).returning();
    return result[0];
  }
  
  async updateStaffAttendance(id: number, attendance: Partial<InsertStaffAttendance>): Promise<StaffAttendance | undefined> {
    const result = await db.update(staffAttendance)
      .set(attendance)
      .where(eq(staffAttendance.id, id))
      .returning();
    return result[0];
  }
  
  async deleteStaffAttendance(id: number): Promise<boolean> {
    await db.delete(staffAttendance).where(eq(staffAttendance.id, id));
    return true;
  }
  
  // Staff salary
  async getStaffSalary(staffId: number): Promise<StaffSalary[]> {
    return await db.select().from(staffSalary).where(eq(staffSalary.staffId, staffId));
  }
  
  async getStaffSalaryById(id: number): Promise<StaffSalary | undefined> {
    const result = await db.select().from(staffSalary).where(eq(staffSalary.id, id));
    return result[0];
  }
  
  async createStaffSalary(salary: InsertStaffSalary): Promise<StaffSalary> {
    const result = await db.insert(staffSalary).values(salary).returning();
    return result[0];
  }
  
  async updateStaffSalary(id: number, salary: Partial<InsertStaffSalary>): Promise<StaffSalary | undefined> {
    const result = await db.update(staffSalary)
      .set(salary)
      .where(eq(staffSalary.id, id))
      .returning();
    return result[0];
  }
  
  async deleteStaffSalary(id: number): Promise<boolean> {
    await db.delete(staffSalary).where(eq(staffSalary.id, id));
    return true;
  }
  
  // Invoice management
  async getInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices);
  }
  
  async getInvoiceById(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }
  
  async getInvoicesByPatientId(patientId: string): Promise<Invoice[]> {
    return await db.select().from(invoices).where(eq(invoices.patientId, patientId));
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    // Get all existing invoice IDs
    const existingInvoices = await db.select({ id: invoices.id }).from(invoices).orderBy(invoices.id);
    
    // Find the smallest available ID (gap) starting from 1
    let availableId = 1;
    for (const existingInvoice of existingInvoices) {
      if (existingInvoice.id === availableId) {
        availableId++;
      } else {
        // Found a gap
        break;
      }
    }
    
    // If we specify an ID, Postgres will use it instead of auto-incrementing
    // This way we can reuse previously deleted invoice numbers
    const invoiceWithId = { 
      ...invoice, 
      id: availableId 
    };
    
    const result = await db.insert(invoices).values(invoiceWithId).returning();
    return result[0];
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    await db.delete(invoices).where(eq(invoices.id, id));
    return true;
  }
  
  // Invoice items
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  }
  
  async getInvoiceItemById(id: number): Promise<InvoiceItem | undefined> {
    const result = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return result[0];
  }
  
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const result = await db.insert(invoiceItems).values(item).returning();
    return result[0];
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem | undefined> {
    const result = await db.update(invoiceItems)
      .set(item)
      .where(eq(invoiceItems.id, id))
      .returning();
    return result[0];
  }
  
  async deleteInvoiceItem(id: number): Promise<boolean> {
    await db.delete(invoiceItems).where(eq(invoiceItems.id, id));
    return true;
  }
  
  // Settings
  async getSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
  
  async getSettingsByCategory(category: string): Promise<Setting[]> {
    return await db.select().from(settings).where(eq(settings.category, category));
  }
  
  async getSettingByKey(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settings).where(eq(settings.settingKey, key));
    return result[0];
  }
  
  async createSetting(setting: InsertSetting): Promise<Setting> {
    const result = await db.insert(settings).values(setting).returning();
    return result[0];
  }
  
  async updateSetting(id: number, setting: Partial<InsertSetting>): Promise<Setting | undefined> {
    const result = await db.update(settings)
      .set(setting)
      .where(eq(settings.id, id))
      .returning();
    return result[0];
  }
  
  async deleteSetting(id: number): Promise<boolean> {
    await db.delete(settings).where(eq(settings.id, id));
    return true;
  }
  
  // Medication management
  async getMedications(): Promise<Medication[]> {
    return await db.select().from(medications);
  }
  
  async getMedicationById(id: number): Promise<Medication | undefined> {
    const result = await db.select().from(medications).where(eq(medications.id, id));
    return result[0];
  }
  
  async getMedicationByName(name: string): Promise<Medication | undefined> {
    const result = await db.select().from(medications).where(eq(medications.name, name));
    return result[0];
  }
  
  async createMedication(medication: InsertMedication): Promise<Medication> {
    const result = await db.insert(medications).values(medication).returning();
    return result[0];
  }
  
  async updateMedication(id: number, medication: Partial<InsertMedication>): Promise<Medication | undefined> {
    const result = await db.update(medications)
      .set(medication)
      .where(eq(medications.id, id))
      .returning();
    return result[0];
  }
  
  async deleteMedication(id: number): Promise<boolean> {
    await db.delete(medications).where(eq(medications.id, id));
    return true;
  }
  
  // Prescription management
  async getPrescriptions(visitId: number): Promise<Prescription[]> {
    return await db.select().from(prescriptions)
      .where(eq(prescriptions.visitId, visitId))
      .orderBy(asc(prescriptions.id));
  }
  
  async getPrescriptionById(id: number): Promise<Prescription | undefined> {
    const result = await db.select().from(prescriptions).where(eq(prescriptions.id, id));
    return result[0];
  }
  
  async createPrescription(prescription: InsertPrescription): Promise<Prescription> {
    const result = await db.insert(prescriptions).values(prescription).returning();
    return result[0];
  }
  
  async updatePrescription(id: number, prescription: Partial<InsertPrescription>): Promise<Prescription | undefined> {
    const result = await db.update(prescriptions)
      .set(prescription)
      .where(eq(prescriptions.id, id))
      .returning();
    return result[0];
  }
  
  async deletePrescription(id: number): Promise<boolean> {
    await db.delete(prescriptions).where(eq(prescriptions.id, id));
    return true;
  }

  // Tooth findings
  async getToothFindings(visitId: number): Promise<ToothFinding[]> {
    return await db.select().from(toothFindings).where(eq(toothFindings.visitId, visitId));
  }
  
  async getToothFindingById(id: number): Promise<ToothFinding | undefined> {
    const result = await db.select().from(toothFindings).where(eq(toothFindings.id, id));
    return result[0];
  }
  
  async createToothFinding(finding: InsertToothFinding): Promise<ToothFinding> {
    const result = await db.insert(toothFindings).values(finding).returning();
    return result[0];
  }
  
  async updateToothFinding(id: number, finding: Partial<InsertToothFinding>): Promise<ToothFinding | undefined> {
    const result = await db.update(toothFindings)
      .set(finding)
      .where(eq(toothFindings.id, id))
      .returning();
    return result[0];
  }
  
  async deleteToothFinding(id: number): Promise<boolean> {
    await db.delete(toothFindings).where(eq(toothFindings.id, id));
    return true;
  }
  
  // Generalized findings
  async getGeneralizedFindings(visitId: number): Promise<GeneralizedFinding[]> {
    return await db.select().from(generalizedFindings).where(eq(generalizedFindings.visitId, visitId));
  }
  
  async getGeneralizedFindingById(id: number): Promise<GeneralizedFinding | undefined> {
    const result = await db.select().from(generalizedFindings).where(eq(generalizedFindings.id, id));
    return result[0];
  }
  
  async createGeneralizedFinding(finding: InsertGeneralizedFinding): Promise<GeneralizedFinding> {
    const result = await db.insert(generalizedFindings).values(finding).returning();
    return result[0];
  }
  
  async updateGeneralizedFinding(id: number, finding: Partial<InsertGeneralizedFinding>): Promise<GeneralizedFinding | undefined> {
    const result = await db.update(generalizedFindings)
      .set(finding)
      .where(eq(generalizedFindings.id, id))
      .returning();
    return result[0];
  }
  
  async deleteGeneralizedFinding(id: number): Promise<boolean> {
    await db.delete(generalizedFindings).where(eq(generalizedFindings.id, id));
    return true;
  }
  
  // Investigations
  async getInvestigations(visitId: number): Promise<Investigation[]> {
    return await db.select().from(investigations).where(eq(investigations.visitId, visitId));
  }
  
  async getInvestigationById(id: number): Promise<Investigation | undefined> {
    const result = await db.select().from(investigations).where(eq(investigations.id, id));
    return result[0];
  }
  
  async createInvestigation(investigation: InsertInvestigation): Promise<Investigation> {
    const result = await db.insert(investigations).values(investigation).returning();
    return result[0];
  }
  
  async updateInvestigation(id: number, investigation: Partial<InsertInvestigation>): Promise<Investigation | undefined> {
    const result = await db.update(investigations)
      .set(investigation)
      .where(eq(investigations.id, id))
      .returning();
    return result[0];
  }
  
  async deleteInvestigation(id: number): Promise<boolean> {
    await db.delete(investigations).where(eq(investigations.id, id));
    return true;
  }
  
  // Follow-ups
  async getFollowUps(visitId: number): Promise<FollowUp[]> {
    return await db.select().from(followUps).where(eq(followUps.visitId, visitId));
  }
  
  async getFollowUpById(id: number): Promise<FollowUp | undefined> {
    const result = await db.select().from(followUps).where(eq(followUps.id, id));
    return result[0];
  }
  
  async createFollowUp(followUp: InsertFollowUp): Promise<FollowUp> {
    const result = await db.insert(followUps).values({
      ...followUp,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }
  
  async updateFollowUp(id: number, followUp: Partial<InsertFollowUp>): Promise<FollowUp | undefined> {
    const result = await db.update(followUps)
      .set(followUp)
      .where(eq(followUps.id, id))
      .returning();
    return result[0];
  }
  
  async deleteFollowUp(id: number): Promise<boolean> {
    await db.delete(followUps).where(eq(followUps.id, id));
    return true;
  }

  // Initialize default settings
  async initializeDefaultSettings() {
    // Check if any settings exist
    const existingSettings = await this.getSettings();
    if (existingSettings.length > 0) {
      return; // Settings already exist
    }
    
    // Add default dropdown options
    await this.createSetting({
      settingKey: 'dropdown_options',
      settingValue: {
        medicalHistory: ['Diabetes', 'Hypertension', 'Heart Disease', 'Asthma', 'None'],
        drugAllergy: ['Penicillin', 'NSAIDs', 'Sulfa Drugs', 'Local Anesthetics', 'None'],
        previousDentalHistory: ['Extraction', 'Root Canal Treatment', 'Filling', 'Crown', 'Implant', 'None'],
        chiefComplaint: ['Toothache', 'Tooth Sensitivity', 'Bleeding Gums', 'Bad Breath', 'Broken Tooth', 'Jaw Pain'],
        oralExamination: ['Cavity', 'Gingivitis', 'Periodontitis', 'Abscess', 'Fractured Tooth'],
        investigation: ['X-Ray', 'CBCT', 'Pulp Testing', 'Blood Test', 'None'],
        treatmentPlan: ['Filling', 'Extraction', 'Root Canal', 'Scaling', 'Crown', 'Implant'],
        prescription: ['Antibiotics', 'Painkillers', 'Anti-inflammatory', 'Mouthwash', 'None'],
        treatmentDone: ['Filling', 'Extraction', 'Root Canal', 'Scaling', 'Crown', 'Consultation Only'],
        advice: ['Soft Diet', 'Maintain Oral Hygiene', 'Avoid Hot Food/Beverage', 'Follow-up Required', 'None'],
        labTechnicians: ['Dr. Smith', 'Dr. Johnson', 'Dr. Patel'],
        workTypes: ['Crown', 'Bridge', 'Denture', 'Implant', 'Veneer', 'Retainer', 'Night Guard', 'Other'],
        crownShades: ['A1', 'A2', 'A3', 'A3.5', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D2', 'D3', 'D4']
      },
      category: 'dropdown_options'
    });
    
    // Add settings for dental examination
    await this.createSetting({
      settingKey: 'tooth_finding_options',
      settingValue: {
        options: [
          "Caries", "Deep Caries", "Filling", "Root Canal Treated", "Extraction", 
          "Crown", "Bridge", "Implant", "Denture", "Mobility", 
          "Sensitivity", "Abscess", "Missing", "Impacted", "Malaligned"
        ]
      },
      category: 'dental_examination'
    });
    
    await this.createSetting({
      settingKey: 'investigation_types',
      settingValue: {
        options: [
          "X-Ray", "CBCT", "IOPA", "OPG", "Blood Test", 
          "Vitality Test", "Culture Sensitivity", "Biopsy"
        ]
      },
      category: 'dental_examination'
    });
    
    // Add clinic info settings
    await this.createSetting({
      settingKey: 'clinic_info',
      settingValue: {
        name: "Dr. Shawn's Clinic",
        logo: "",
        address: "",
        phone: "",
        email: ""
      },
      category: 'clinic_info'
    });
    
    // Add patient ID format setting
    await this.createSetting({
      settingKey: 'patient_id_format',
      settingValue: {
        prefix: 'PT',
        yearInFormat: true,
        digitCount: 4,
        separator: '-'
      },
      category: 'patient_id_format'
    });
  }
}

export const storage = new DatabaseStorage();
