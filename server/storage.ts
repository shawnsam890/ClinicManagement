import {
  Patient, InsertPatient,
  PatientVisit, InsertPatientVisit,
  LabWork, InsertLabWork,
  LabInventoryItem, InsertLabInventoryItem,
  Staff, InsertStaff,
  StaffAttendance, InsertStaffAttendance,
  StaffSalary, InsertStaffSalary,
  Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem,
  Setting, InsertSetting
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
  
  // Lab management
  getLabWorks(): Promise<LabWork[]>;
  getLabWorkById(id: number): Promise<LabWork | undefined>;
  getLabWorksByPatientId(patientId: string): Promise<LabWork[]>;
  createLabWork(labWork: InsertLabWork): Promise<LabWork>;
  updateLabWork(id: number, labWork: Partial<InsertLabWork>): Promise<LabWork | undefined>;
  deleteLabWork(id: number): Promise<boolean>;
  
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
  
  // Settings
  getSettings(): Promise<Setting[]>;
  getSettingsByCategory(category: string): Promise<Setting[]>;
  getSettingByKey(key: string): Promise<Setting | undefined>;
  createSetting(setting: InsertSetting): Promise<Setting>;
  updateSetting(id: number, setting: Partial<InsertSetting>): Promise<Setting | undefined>;
  deleteSetting(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private patients: Map<number, Patient>;
  private patientVisits: Map<number, PatientVisit>;
  private labWorks: Map<number, LabWork>;
  private labInventory: Map<number, LabInventoryItem>;
  private staffMembers: Map<number, Staff>;
  private staffAttendance: Map<number, StaffAttendance>;
  private staffSalaries: Map<number, StaffSalary>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private settings: Map<number, Setting>;
  
  private patientIdCounter: number;
  private visitIdCounter: number;
  private labWorkIdCounter: number;
  private labInventoryIdCounter: number;
  private staffIdCounter: number;
  private attendanceIdCounter: number;
  private salaryIdCounter: number;
  private invoiceIdCounter: number;
  private invoiceItemIdCounter: number;
  private settingIdCounter: number;
  
  constructor() {
    this.patients = new Map();
    this.patientVisits = new Map();
    this.labWorks = new Map();
    this.labInventory = new Map();
    this.staffMembers = new Map();
    this.staffAttendance = new Map();
    this.staffSalaries = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.settings = new Map();
    
    this.patientIdCounter = 1;
    this.visitIdCounter = 1;
    this.labWorkIdCounter = 1;
    this.labInventoryIdCounter = 1;
    this.staffIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.salaryIdCounter = 1;
    this.invoiceIdCounter = 1;
    this.invoiceItemIdCounter = 1;
    this.settingIdCounter = 1;
    
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
        advice: ['Soft Diet', 'Maintain Oral Hygiene', 'Avoid Hot Food/Beverage', 'Follow-up Required', 'None']
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

export const storage = new MemStorage();
