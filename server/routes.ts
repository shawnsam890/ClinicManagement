import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPatientSchema, insertPatientVisitSchema, insertLabWorkSchema, 
  insertLabInventorySchema, insertStaffSchema, insertStaffAttendanceSchema, 
  insertStaffSalarySchema, insertInvoiceSchema, insertInvoiceItemSchema, 
  insertSettingSchema, insertMedicationSchema, insertPrescriptionSchema,
  insertAppointmentSchema } from "@shared/schema";
import { z } from "zod";
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { format } from 'date-fns';
import { setupAuth } from "./auth";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Initialize database settings
  try {
    await (storage as any).initializeDefaultSettings();
  } catch (error) {
    console.error('Error initializing default settings:', error);
  }
  
  // Generate patient ID based on format in settings
  async function generatePatientId(): Promise<string> {
    const patientIdFormatSetting = await storage.getSettingByKey('patient_id_format');
    const format = patientIdFormatSetting?.settingValue || {
      prefix: 'PT',
      yearInFormat: true,
      digitCount: 4,
      separator: '-'
    };
    
    const patients = await storage.getPatients();
    const year = new Date().getFullYear();
    let nextNumber = 1;
    
    // If there are existing patients, find the highest patient ID number and increment
    if (patients.length > 0) {
      const patientIds = patients.map(p => p.patientId);
      const regex = new RegExp(`${format.prefix}${format.yearInFormat ? year : ''}${format.separator}(\\d+)$`);
      
      const numbers = patientIds
        .map(id => {
          const match = id.match(regex);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(n => !isNaN(n));
      
      if (numbers.length > 0) {
        nextNumber = Math.max(...numbers) + 1;
      }
    }
    
    const paddedNumber = nextNumber.toString().padStart(format.digitCount, '0');
    return `${format.prefix}${format.yearInFormat ? year : ''}${format.separator}${paddedNumber}`;
  }

  // Patient routes
  app.get('/api/patients', async (req, res) => {
    try {
      const patients = await storage.getPatients();
      res.json(patients);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/patients/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const patient = await storage.getPatientById(id);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/patients/patientId/:patientId', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const patient = await storage.getPatientByPatientId(patientId);
      
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      res.json(patient);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/patients', async (req, res) => {
    try {
      const validatedData = insertPatientSchema.parse(req.body);
      
      // If patientId is not provided, generate one
      if (!validatedData.patientId) {
        validatedData.patientId = await generatePatientId();
      }
      
      const patient = await storage.createPatient(validatedData);
      res.status(201).json(patient);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/patients/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedPatient = await storage.updatePatient(id, req.body);
      if (!updatedPatient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      res.json(updatedPatient);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/patients/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deletePatient(id);
      if (!success) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Patient visits routes
  app.get('/api/patients/:patientId/visits', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const visits = await storage.getPatientVisits(patientId);
      res.json(visits);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/visits/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const visit = await storage.getPatientVisitById(id);
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      res.json(visit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/visits', async (req, res) => {
    try {
      const validatedData = insertPatientVisitSchema.parse(req.body);
      const visit = await storage.createPatientVisit(validatedData);
      res.status(201).json(visit);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/visits/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedVisit = await storage.updatePatientVisit(id, req.body);
      if (!updatedVisit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      res.json(updatedVisit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/visits/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deletePatientVisit(id);
      if (!success) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Lab work routes
  app.get('/api/lab-works', async (req, res) => {
    try {
      const labWorks = await storage.getLabWorks();
      res.json(labWorks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/lab-works/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const labWork = await storage.getLabWorkById(id);
      if (!labWork) {
        return res.status(404).json({ message: 'Lab work not found' });
      }
      
      res.json(labWork);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/patients/:patientId/lab-works', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const labWorks = await storage.getLabWorksByPatientId(patientId);
      res.json(labWorks);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/lab-works', async (req, res) => {
    try {
      const validatedData = insertLabWorkSchema.parse(req.body);
      const labWork = await storage.createLabWork(validatedData);
      res.status(201).json(labWork);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/lab-works/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedLabWork = await storage.updateLabWork(id, req.body);
      if (!updatedLabWork) {
        return res.status(404).json({ message: 'Lab work not found' });
      }
      
      res.json(updatedLabWork);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/lab-works/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteLabWork(id);
      if (!success) {
        return res.status(404).json({ message: 'Lab work not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Lab inventory routes
  app.get('/api/lab-inventory', async (req, res) => {
    try {
      const inventory = await storage.getLabInventory();
      res.json(inventory);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/lab-inventory/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const item = await storage.getLabInventoryItemById(id);
      if (!item) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/lab-inventory', async (req, res) => {
    try {
      const validatedData = insertLabInventorySchema.parse(req.body);
      const item = await storage.createLabInventoryItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/lab-inventory/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedItem = await storage.updateLabInventoryItem(id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      res.json(updatedItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/lab-inventory/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteLabInventoryItem(id);
      if (!success) {
        return res.status(404).json({ message: 'Inventory item not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Staff routes
  app.get('/api/staff', async (req, res) => {
    try {
      const staff = await storage.getStaff();
      res.json(staff);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/staff/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const staffMember = await storage.getStaffById(id);
      if (!staffMember) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      res.json(staffMember);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/staff', async (req, res) => {
    try {
      const validatedData = insertStaffSchema.parse(req.body);
      const staffMember = await storage.createStaff(validatedData);
      res.status(201).json(staffMember);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/staff/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedStaff = await storage.updateStaff(id, req.body);
      if (!updatedStaff) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      res.json(updatedStaff);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/staff/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteStaff(id);
      if (!success) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Staff attendance routes
  app.get('/api/staff/:staffId/attendance', async (req, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      if (isNaN(staffId)) {
        return res.status(400).json({ message: 'Invalid Staff ID' });
      }
      
      const attendance = await storage.getStaffAttendance(staffId);
      res.json(attendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/attendance', async (req, res) => {
    try {
      const validatedData = insertStaffAttendanceSchema.parse(req.body);
      const attendance = await storage.createStaffAttendance(validatedData);
      res.status(201).json(attendance);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/attendance/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedAttendance = await storage.updateStaffAttendance(id, req.body);
      if (!updatedAttendance) {
        return res.status(404).json({ message: 'Attendance record not found' });
      }
      
      res.json(updatedAttendance);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Staff salary routes
  app.get('/api/staff/:staffId/salary', async (req, res) => {
    try {
      const staffId = parseInt(req.params.staffId);
      if (isNaN(staffId)) {
        return res.status(400).json({ message: 'Invalid Staff ID' });
      }
      
      const salaries = await storage.getStaffSalary(staffId);
      res.json(salaries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/salary', async (req, res) => {
    try {
      const validatedData = insertStaffSalarySchema.parse(req.body);
      const salary = await storage.createStaffSalary(validatedData);
      res.status(201).json(salary);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/salary/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedSalary = await storage.updateStaffSalary(id, req.body);
      if (!updatedSalary) {
        return res.status(404).json({ message: 'Salary record not found' });
      }
      
      res.json(updatedSalary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Invoice routes
  app.get('/api/invoices', async (req, res) => {
    try {
      const invoices = await storage.getInvoices();
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/invoices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/patients/:patientId/invoices', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const invoices = await storage.getInvoicesByPatientId(patientId);
      res.json(invoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Invoice items endpoint is below around line 670
  
  app.post('/api/invoices', async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      const invoice = await storage.createInvoice(validatedData);
      res.status(201).json(invoice);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/invoices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedInvoice = await storage.updateInvoice(id, req.body);
      if (!updatedInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add PATCH endpoint for partial invoice updates (like status changes)
  app.patch('/api/invoices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      // Get the current invoice first
      const currentInvoice = await storage.getInvoiceById(id);
      if (!currentInvoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Merge the current invoice with the updates
      const updatedData = { ...currentInvoice, ...req.body };
      
      const updatedInvoice = await storage.updateInvoice(id, updatedData);
      if (!updatedInvoice) {
        return res.status(404).json({ message: 'Invoice update failed' });
      }
      
      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Invoice items routes
  app.get('/api/invoices/:invoiceId/items', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.invoiceId);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: 'Invalid Invoice ID' });
      }
      
      const items = await storage.getInvoiceItems(invoiceId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/invoice-items', async (req, res) => {
    try {
      const validatedData = insertInvoiceItemSchema.parse(req.body);
      const item = await storage.createInvoiceItem(validatedData);
      res.status(201).json(item);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/invoice-items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedItem = await storage.updateInvoiceItem(id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ message: 'Invoice item not found' });
      }
      
      res.json(updatedItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/invoice-items/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteInvoiceItem(id);
      if (!success) {
        return res.status(404).json({ message: 'Invoice item not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Appointment routes
  app.get('/api/appointments', async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/appointments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const appointment = await storage.getAppointmentById(id);
      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/patients/:patientId/appointments', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      const appointments = await storage.getAppointmentsByPatientId(patientId);
      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/appointments', async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/appointments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedAppointment = await storage.updateAppointment(id, req.body);
      if (!updatedAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.json(updatedAppointment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/appointments/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteAppointment(id);
      if (!success) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Settings routes
  app.get('/api/settings', async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/settings/category/:category', async (req, res) => {
    try {
      const category = req.params.category;
      const settings = await storage.getSettingsByCategory(category);
      res.json(settings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/settings/key/:key', async (req, res) => {
    try {
      const key = req.params.key;
      const setting = await storage.getSettingByKey(key);
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      res.json(setting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/settings', async (req, res) => {
    try {
      const validatedData = insertSettingSchema.parse(req.body);
      const setting = await storage.createSetting(validatedData);
      res.status(201).json(setting);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/settings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedSetting = await storage.updateSetting(id, req.body);
      if (!updatedSetting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      res.json(updatedSetting);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // File upload route for clinic logo
  app.post('/api/upload/logo', upload.single('logo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // Get clinic info setting
      const clinicInfoSetting = await storage.getSettingByKey('clinic_info');
      if (!clinicInfoSetting) {
        return res.status(404).json({ message: 'Clinic info setting not found' });
      }
      
      // Convert image to base64
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUri = `data:${mimeType};base64,${base64Image}`;
      
      // Update clinic info with new logo
      const clinicInfo = clinicInfoSetting.settingValue;
      clinicInfo.logo = dataUri;
      
      await storage.updateSetting(clinicInfoSetting.id, {
        settingValue: clinicInfo
      });
      
      res.json({ message: 'Logo uploaded successfully', logo: dataUri });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // File upload route for patient attachments
  app.post('/api/upload/patient-attachment', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const visitId = req.body.visitId;
      if (!visitId) {
        return res.status(400).json({ message: 'Visit ID is required' });
      }
      
      const visit = await storage.getPatientVisitById(parseInt(visitId));
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      // Convert file to base64
      const base64File = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const dataUri = `data:${mimeType};base64,${base64File}`;
      
      // Update visit attachments
      const attachments = visit.attachments || [];
      attachments.push({
        id: Date.now().toString(),
        name: req.file.originalname,
        type: mimeType,
        url: dataUri,
        dateAdded: new Date().toISOString()
      });
      
      await storage.updatePatientVisit(visit.id, {
        attachments
      });
      
      res.json({ message: 'File uploaded successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Medication routes
  app.get('/api/medications', async (req, res) => {
    try {
      const medications = await storage.getMedications();
      res.json(medications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const medication = await storage.getMedicationById(id);
      if (!medication) {
        return res.status(404).json({ message: 'Medication not found' });
      }
      
      res.json(medication);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/medications', async (req, res) => {
    try {
      const validatedData = insertMedicationSchema.parse(req.body);
      const medication = await storage.createMedication(validatedData);
      res.status(201).json(medication);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedMedication = await storage.updateMedication(id, req.body);
      if (!updatedMedication) {
        return res.status(404).json({ message: 'Medication not found' });
      }
      
      res.json(updatedMedication);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/medications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteMedication(id);
      if (!success) {
        return res.status(404).json({ message: 'Medication not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Prescription routes
  app.get('/api/visits/:visitId/prescriptions', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid visit ID' });
      }
      
      const prescriptions = await storage.getPrescriptions(visitId);
      res.json(prescriptions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get('/api/prescriptions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const prescription = await storage.getPrescriptionById(id);
      if (!prescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      
      res.json(prescription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post('/api/prescriptions', async (req, res) => {
    try {
      const validatedData = insertPrescriptionSchema.parse(req.body);
      const prescription = await storage.createPrescription(validatedData);
      res.status(201).json(prescription);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/prescriptions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedPrescription = await storage.updatePrescription(id, req.body);
      if (!updatedPrescription) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      
      res.json(updatedPrescription);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete('/api/prescriptions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deletePrescription(id);
      if (!success) {
        return res.status(404).json({ message: 'Prescription not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create the HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}
