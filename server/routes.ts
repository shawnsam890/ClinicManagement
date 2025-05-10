import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { insertPatientSchema, insertPatientVisitSchema, insertLabWorkSchema, 
  insertLabInventorySchema, insertStaffSchema, insertStaffAttendanceSchema, 
  insertStaffSalarySchema, insertInvoiceSchema, insertInvoiceItemSchema, 
  insertSettingSchema, insertMedicationSchema, insertPrescriptionSchema,
  insertAppointmentSchema, patientVisits, insertToothFindingSchema,
  insertGeneralizedFindingSchema, insertInvestigationSchema, insertFollowUpSchema,
  insertDoctorSignatureSchema, doctorSignatures } from "@shared/schema";
import { z } from "zod";
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { setupAuth } from "./auth";
import { v4 as uuid } from 'uuid';

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
      const id = req.params.id;
      
      // First, try to find by patientId (string format like PT2025-0001)
      let patient = await storage.getPatientByPatientId(id);
      
      // If not found and id is a number, try to find by numeric id
      if (!patient && !isNaN(parseInt(id))) {
        patient = await storage.getPatientById(parseInt(id));
      }
      
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
  
  // Update patient by patientId string (for the patient record page)
  app.patch('/api/patients/:patientId', async (req, res) => {
    try {
      const patientId = req.params.patientId;
      
      // Get patient first
      const patient = await storage.getPatientByPatientId(patientId);
      if (!patient) {
        return res.status(404).json({ message: 'Patient not found' });
      }
      
      // Update patient
      const updatedPatient = await storage.updatePatient(patient.id, req.body);
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
  
  // Get follow-ups for a specific visit
  app.get('/api/visits/:visitId/follow-ups', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid Visit ID' });
      }
      
      // Use storage instead of direct DB query to follow the pattern
      const visits = await storage.getPatientVisits("all");
      const followUps = visits.filter(visit => visit.previousVisitId === visitId);
      
      res.json(followUps);
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
      // Allow previousVisitId to be included in the request
      const validatedData = insertPatientVisitSchema.parse(req.body);
      
      // Create the visit with possible follow-up relationship
      const visit = await storage.createPatientVisit(validatedData);
      res.status(201).json(visit);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create a follow-up visit
  app.post('/api/visits/:visitId/follow-up', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid Visit ID' });
      }
      
      // Get the original visit
      const originalVisit = await storage.getPatientVisitById(visitId);
      if (!originalVisit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      // Create a new visit as follow-up
      // Format date as YYYY-MM-DD to match the expected PostgreSQL date format
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      const followUpVisit = await storage.createPatientVisit({
        patientId: originalVisit.patientId,
        date: formattedDate,
        chiefComplaint: `Follow-up: ${originalVisit.chiefComplaint || 'Appointment'}`,
        previousVisitId: visitId,
      });
      
      res.status(201).json(followUpVisit);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put('/api/visits/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      // Make a copy of the request body to manipulate
      const visitData = { ...req.body };
      
      // Handle empty dates to avoid PostgreSQL errors
      // Convert empty strings to null for date fields
      if (visitData.nextAppointment === '') {
        visitData.nextAppointment = null;
      }
      
      if (visitData.date === '') {
        visitData.date = null;
      }
      
      const updatedVisit = await storage.updatePatientVisit(id, visitData);
      if (!updatedVisit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      res.json(updatedVisit);
    } catch (error: any) {
      console.error("Error updating visit:", error);
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
  
  // Get invoices by visit ID
  app.get('/api/visits/:visitId/invoices', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid visit ID' });
      }
      
      // Get invoices filtered by visit ID
      const allInvoices = await storage.getInvoices();
      const visitInvoices = allInvoices.filter(invoice => invoice.visitId === visitId);
      res.json(visitInvoices);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin route to reset invoice numbering - for maintenance
  app.post('/api/admin/reset-invoice-sequence', async (req, res) => {
    try {
      // Only allow this in development mode
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ message: 'This operation is only allowed in development mode' });
      }
      
      try {
        // Use direct SQL with the database connection from the pool
        const { pool } = await import('./db');
        
        // This is a PostgreSQL-specific command to reset the sequence
        await pool.query('ALTER SEQUENCE invoices_id_seq RESTART WITH 1');
        return res.json({ message: 'Invoice sequence reset successfully' });
      } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Database error when resetting sequence' });
      }
    } catch (error: any) {
      console.error('Error resetting invoice sequence:', error);
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
      
      // Log the request body to debug
      console.log('PATCH invoice update:', req.body);
      
      // Handle special case for status update
      if (req.body.status) {
        const newStatus = req.body.status;
        let paymentMethod = req.body.paymentMethod;
        let paymentDate = null;
        
        // Attempt to get existing payment date
        try {
          paymentDate = currentInvoice.paymentDate;
        } catch (e) {
          console.log('Error accessing payment date:', e);
        }
        
        // Add payment date if status is paid
        if (newStatus === 'paid') {
          // Always set a payment date when status is changed to paid
          paymentDate = new Date().toISOString().split('T')[0];
          console.log('Setting payment date for paid invoice:', paymentDate);
        } else if (newStatus !== 'paid') {
          // Clear payment info if not paid
          paymentDate = null;
          paymentMethod = null;
          console.log('Clearing payment info for unpaid invoice');
        }
        
        // Prepare the update with explicit values
        const updateData = {
          ...req.body,
          paymentDate,
          paymentMethod
        };
        
        console.log('Final update data:', updateData);
        
        // Merge with current invoice data, but with our values taking precedence
        const updatedData = { ...currentInvoice, ...updateData };
        
        const updatedInvoice = await storage.updateInvoice(id, updatedData);
        if (!updatedInvoice) {
          return res.status(404).json({ message: 'Invoice update failed' });
        }
        
        return res.json(updatedInvoice);
      } else {
        // For non-status updates, just merge the data
        const updatedData = { ...currentInvoice, ...req.body };
        
        const updatedInvoice = await storage.updateInvoice(id, updatedData);
        if (!updatedInvoice) {
          return res.status(404).json({ message: 'Invoice update failed' });
        }
        
        res.json(updatedInvoice);
      }
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Add DELETE endpoint for invoice deletion
  app.delete('/api/invoices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      // First check if the invoice exists
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: 'Invoice not found' });
      }
      
      // Find and update any appointments that reference this invoice
      const appointments = await storage.getAppointments();
      
      for (const appointment of appointments) {
        if (appointment.invoiceId === id) {
          // Update the appointment to remove the invoice reference
          await storage.updateAppointment(appointment.id, { ...appointment, invoiceId: null });
        }
      }
      
      // Delete invoice items first
      const invoiceItems = await storage.getInvoiceItems(id);
      for (const item of invoiceItems) {
        await storage.deleteInvoiceItem(item.id);
      }
      
      // Delete the invoice
      const success = await storage.deleteInvoice(id);
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete invoice' });
      }
      
      // Return success with no content
      res.status(204).end();
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
      
      // Check if we need to create an invoice
      const currentAppointment = await storage.getAppointmentById(id);
      if (!currentAppointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }
      
      // If an invoice doesn't exist but was requested to be created
      const requestData = req.body;
      const shouldCreateInvoice = 
        !currentAppointment.invoiceId && 
        (requestData.invoiceId === null || requestData.invoiceId === undefined);
        
      // Create a new invoice if needed
      let invoiceId = currentAppointment.invoiceId;
      if (shouldCreateInvoice) {
        // Create a basic invoice with default values
        const newInvoice = await storage.createInvoice({
          patientId: currentAppointment.patientId,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          totalAmount: 0, // Will be updated when items are added
          notes: 'Auto-generated invoice',
        });
        
        if (newInvoice) {
          // Update the request data with the new invoice ID
          invoiceId = newInvoice.id;
          requestData.invoiceId = invoiceId;
        }
      }
      
      // Update the appointment with potentially modified data
      const updatedAppointment = await storage.updateAppointment(id, requestData);
      if (!updatedAppointment) {
        return res.status(404).json({ message: 'Appointment update failed' });
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
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Generate unique filename to prevent collisions
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `${uuid()}${fileExtension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      
      // Save file to disk
      fs.writeFileSync(filePath, req.file.buffer);
      
      // Create file URL for the attachment
      const fileUrl = `/uploads/${uniqueFilename}`;
      
      // Update visit attachments
      let attachments = [];
      try {
        // Handle existing attachments which might be a JSON string
        if (visit.attachments) {
          if (typeof visit.attachments === 'string') {
            attachments = JSON.parse(visit.attachments);
          } else if (Array.isArray(visit.attachments)) {
            attachments = visit.attachments;
          }
        }
      } catch (error) {
        console.error("Error parsing existing attachments:", error);
        attachments = [];
      }
      
      // Add new attachment
      attachments.push({
        id: uuid(),
        name: req.file.originalname,
        type: req.file.mimetype,
        url: fileUrl,
        dateAdded: new Date().toISOString()
      });
      
      await storage.updatePatientVisit(visit.id, {
        attachments: JSON.stringify(attachments)
      });
      
      res.json({ 
        message: 'File uploaded successfully',
        file: {
          name: req.file.originalname,
          url: fileUrl
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // File upload route for media files (multiple)
  app.post('/api/upload/media', upload.array('files'), async (req, res) => {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      const { visitId } = req.body;
      if (!visitId) {
        return res.status(400).json({ message: 'Visit ID is required' });
      }
      
      const visit = await storage.getPatientVisitById(parseInt(visitId));
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      // Ensure uploads directory exists
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      // Save files to disk and create attachment objects
      const mediaFiles = [];
      for (const file of req.files) {
        // Generate unique filename to prevent collisions
        const fileExtension = path.extname(file.originalname);
        const uniqueFilename = `${uuid()}${fileExtension}`;
        const filePath = path.join(uploadsDir, uniqueFilename);
        
        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);
        
        // Create file URL for the attachment
        const fileUrl = `/uploads/${uniqueFilename}`;
        
        mediaFiles.push({
          id: uuid(),
          name: file.originalname,
          type: file.mimetype,
          url: fileUrl,
          filename: uniqueFilename,
          dateAdded: new Date().toISOString()
        });
      }
      
      // Update visit attachments
      let attachments = [];
      try {
        // Handle existing attachments which might be a JSON string
        if (visit.attachments) {
          if (typeof visit.attachments === 'string') {
            attachments = JSON.parse(visit.attachments);
          } else if (Array.isArray(visit.attachments)) {
            attachments = visit.attachments;
          }
        }
      } catch (error) {
        console.error("Error parsing existing attachments:", error);
        attachments = [];
      }
      
      // Combine existing and new attachments
      attachments = [...attachments, ...mediaFiles];
      
      await storage.updatePatientVisit(visit.id, {
        attachments: JSON.stringify(attachments)
      });
      
      res.json({ 
        message: `${mediaFiles.length} files uploaded successfully`, 
        files: mediaFiles.map(file => ({ name: file.name, type: file.type, url: file.url }))
      });
    } catch (error: any) {
      console.error('Error uploading media files:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Delete media file endpoint
  app.delete('/api/visits/:visitId/media/:fileId', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      const fileId = req.params.fileId;
      
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid visit ID' });
      }
      
      if (!fileId) {
        return res.status(400).json({ message: 'File ID is required' });
      }
      
      const visit = await storage.getPatientVisitById(visitId);
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      // Parse attachments
      let attachments = [];
      try {
        if (visit.attachments) {
          if (typeof visit.attachments === 'string') {
            attachments = JSON.parse(visit.attachments);
          } else if (Array.isArray(visit.attachments)) {
            attachments = visit.attachments;
          }
        }
      } catch (error) {
        console.error("Error parsing attachments:", error);
        return res.status(500).json({ message: 'Error parsing attachments' });
      }
      
      // Find the file to delete
      const fileIndex = attachments.findIndex((file: any) => file.id === fileId);
      
      if (fileIndex === -1) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      const fileToDelete = attachments[fileIndex];
      
      // Delete the file from disk if it has a filename
      if (fileToDelete.filename) {
        const filePath = path.join(process.cwd(), 'uploads', fileToDelete.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      // Remove the file from the attachments array
      attachments.splice(fileIndex, 1);
      
      // Update the visit with the new attachments array
      await storage.updatePatientVisit(visitId, {
        attachments: JSON.stringify(attachments)
      });
      
      res.json({ message: 'File deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting media file:', error);
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
  
  // Tooth Findings routes
  app.get('/api/visits/:visitId/tooth-findings', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid Visit ID' });
      }
      
      const findings = await storage.getToothFindings(visitId);
      res.json(findings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/tooth-findings', async (req, res) => {
    try {
      const validatedData = insertToothFindingSchema.parse(req.body);
      const finding = await storage.createToothFinding(validatedData);
      res.status(201).json(finding);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/tooth-findings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedFinding = await storage.updateToothFinding(id, req.body);
      if (!updatedFinding) {
        return res.status(404).json({ message: 'Finding not found' });
      }
      
      res.json(updatedFinding);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/tooth-findings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteToothFinding(id);
      if (!success) {
        return res.status(404).json({ message: 'Finding not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generalized Findings routes
  app.get('/api/visits/:visitId/generalized-findings', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid Visit ID' });
      }
      
      const findings = await storage.getGeneralizedFindings(visitId);
      res.json(findings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/generalized-findings', async (req, res) => {
    try {
      const validatedData = insertGeneralizedFindingSchema.parse(req.body);
      const finding = await storage.createGeneralizedFinding(validatedData);
      res.status(201).json(finding);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/generalized-findings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedFinding = await storage.updateGeneralizedFinding(id, req.body);
      if (!updatedFinding) {
        return res.status(404).json({ message: 'Finding not found' });
      }
      
      res.json(updatedFinding);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/generalized-findings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteGeneralizedFinding(id);
      if (!success) {
        return res.status(404).json({ message: 'Finding not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Investigations routes
  app.get('/api/visits/:visitId/investigations', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid Visit ID' });
      }
      
      const investigations = await storage.getInvestigations(visitId);
      res.json(investigations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/investigations', async (req, res) => {
    try {
      const validatedData = insertInvestigationSchema.parse(req.body);
      const investigation = await storage.createInvestigation(validatedData);
      res.status(201).json(investigation);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/investigations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedInvestigation = await storage.updateInvestigation(id, req.body);
      if (!updatedInvestigation) {
        return res.status(404).json({ message: 'Investigation not found' });
      }
      
      res.json(updatedInvestigation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/investigations/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteInvestigation(id);
      if (!success) {
        return res.status(404).json({ message: 'Investigation not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Follow-ups routes
  app.get('/api/visits/:visitId/follow-ups', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      if (isNaN(visitId)) {
        return res.status(400).json({ message: 'Invalid Visit ID' });
      }
      
      const followUps = await storage.getFollowUps(visitId);
      res.json(followUps);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/follow-ups', async (req, res) => {
    try {
      const validatedData = insertFollowUpSchema.parse(req.body);
      const followUp = await storage.createFollowUp(validatedData);
      res.status(201).json(followUp);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/follow-ups/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const updatedFollowUp = await storage.updateFollowUp(id, req.body);
      if (!updatedFollowUp) {
        return res.status(404).json({ message: 'Follow-up not found' });
      }
      
      res.json(updatedFollowUp);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/follow-ups/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const success = await storage.deleteFollowUp(id);
      if (!success) {
        return res.status(404).json({ message: 'Follow-up not found' });
      }
      
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Doctor signatures routes
  app.get('/api/doctor-signatures', async (req, res) => {
    try {
      const signatures = await db.select().from(doctorSignatures);
      res.json(signatures);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/doctor-signatures/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const [signature] = await db.select().from(doctorSignatures).where(eq(doctorSignatures.id, id));
      if (!signature) {
        return res.status(404).json({ message: 'Doctor signature not found' });
      }
      
      res.json(signature);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/doctor-signatures', async (req, res) => {
    try {
      const { doctorName, signatureImage } = req.body;
      
      if (!doctorName) {
        return res.status(400).json({ message: 'Doctor name is required' });
      }

      if (!signatureImage) {
        return res.status(400).json({ message: 'Signature image is required' });
      }
      
      // Check if doctor already has a signature
      const [existingSignature] = await db.select().from(doctorSignatures).where(eq(doctorSignatures.doctorName, doctorName));
      
      let signature;
      if (existingSignature) {
        // Update existing signature
        [signature] = await db.update(doctorSignatures)
          .set({ signatureImage })
          .where(eq(doctorSignatures.id, existingSignature.id))
          .returning();
      } else {
        // Create new signature
        const validatedData = insertDoctorSignatureSchema.parse({
          doctorName,
          signatureImage
        });
        
        [signature] = await db.insert(doctorSignatures)
          .values(validatedData)
          .returning();
      }
      
      res.status(201).json(signature);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/doctor-signatures/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      const { doctorName, signatureImage } = req.body;
      
      if (!doctorName) {
        return res.status(400).json({ message: 'Doctor name is required' });
      }
      
      // Find the signature
      const [existingSignature] = await db.select().from(doctorSignatures).where(eq(doctorSignatures.id, id));
      if (!existingSignature) {
        return res.status(404).json({ message: 'Doctor signature not found' });
      }
      
      // Prepare update data
      const updateData: any = { doctorName };
      if (signatureImage) {
        updateData.signatureImage = signatureImage;
      }
      
      // Update the signature
      const [updatedSignature] = await db.update(doctorSignatures)
        .set(updateData)
        .where(eq(doctorSignatures.id, id))
        .returning();
      
      res.json(updatedSignature);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/doctor-signatures/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid ID' });
      }
      
      await db.delete(doctorSignatures).where(eq(doctorSignatures.id, id));
      res.status(204).end();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Endpoint to delete visit attachments
  app.delete('/api/visits/:visitId/attachments/:attachmentIndex', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      const attachmentIndex = parseInt(req.params.attachmentIndex);
      
      if (isNaN(visitId) || isNaN(attachmentIndex)) {
        return res.status(400).json({ message: 'Invalid visit ID or attachment index' });
      }
      
      // Get the visit
      const visit = await storage.getPatientVisitById(visitId);
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      // Check if visit has attachments
      if (!visit.attachments || !Array.isArray(visit.attachments)) {
        return res.status(404).json({ message: 'No attachments found for this visit' });
      }
      
      // Check if the attachment index exists
      if (attachmentIndex < 0 || attachmentIndex >= visit.attachments.length) {
        return res.status(404).json({ message: 'Attachment not found' });
      }
      
      // Remove the attachment
      const updatedAttachments = [...visit.attachments];
      updatedAttachments.splice(attachmentIndex, 1);
      
      // Update the visit
      await storage.updatePatientVisit(visitId, { attachments: updatedAttachments });
      
      res.status(200).json({ message: 'Attachment deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // Endpoint to delete consent forms
  app.delete('/api/visits/:visitId/consent-forms/:formIndex', async (req, res) => {
    try {
      const visitId = parseInt(req.params.visitId);
      const formIndex = parseInt(req.params.formIndex);
      
      if (isNaN(visitId) || isNaN(formIndex)) {
        return res.status(400).json({ message: 'Invalid visit ID or form index' });
      }
      
      // Get the visit
      const visit = await storage.getPatientVisitById(visitId);
      if (!visit) {
        return res.status(404).json({ message: 'Visit not found' });
      }
      
      // Check if visit has consent forms
      if (!visit.consentForms || !Array.isArray(visit.consentForms)) {
        return res.status(404).json({ message: 'No consent forms found for this visit' });
      }
      
      // Check if the form index exists
      if (formIndex < 0 || formIndex >= visit.consentForms.length) {
        return res.status(404).json({ message: 'Consent form not found' });
      }
      
      // Remove the consent form
      const updatedConsentForms = [...visit.consentForms];
      updatedConsentForms.splice(formIndex, 1);
      
      // Update the visit
      await storage.updatePatientVisit(visitId, { consentForms: updatedConsentForms });
      
      res.status(200).json({ message: 'Consent form deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
