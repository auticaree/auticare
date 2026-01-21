import { z } from "zod";
import { Role } from "@prisma/client";

// Registration schema
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  role: z.enum([Role.PARENT, Role.CLINICIAN, Role.SUPPORT]),
  phone: z.string().optional(),
  licenseNumber: z.string().optional(),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Child profile schema
export const childProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  dateOfBirth: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date",
  }),
  timezone: z.string().default("America/New_York"),
  notes: z.string().optional(),
});

// Access invite schema
export const accessInviteSchema = z.object({
  childId: z.string().cuid(),
  recipientEmail: z.string().email("Invalid email address"),
  scopes: z.array(z.enum(["MEDICAL_NOTES", "SUPPORT_NOTES", "MESSAGES", "VIDEO_VISITS"])),
});

// Medical note schema (SOAP format)
export const medicalNoteSchema = z.object({
  childId: z.string().cuid(),
  noteType: z.enum(["anamnesis", "visit", "care_plan", "medication"]),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  medications: z.string().optional(),
  vitals: z.string().optional(),
});

// Support note schema
export const supportNoteSchema = z.object({
  childId: z.string().cuid(),
  sessionSummary: z.string().optional(),
  goals: z.string().optional(),
  interventions: z.string().optional(),
  observations: z.string().optional(),
  progress: z.string().optional(),
  homePractice: z.string().optional(),
});

// Message schema
export const messageSchema = z.object({
  threadId: z.string().cuid(),
  content: z.string().min(1, "Message cannot be empty"),
});

// Video visit schema
export const videoVisitSchema = z.object({
  childId: z.string().cuid(),
  title: z.string().min(1, "Title is required"),
  reason: z.string().optional(),
  scheduledAt: z.string().optional(),
  participantIds: z.array(z.string().cuid()),
});

// Garden task schema
export const gardenTaskSchema = z.object({
  gardenId: z.string().cuid(),
  taskType: z.string(),
  title: z.string(),
  icon: z.string(),
  points: z.number().default(10),
});

// Questionnaire response schema
export const questionnaireResponseSchema = z.object({
  childId: z.string().cuid(),
  responses: z.string(), // JSON string
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChildProfileInput = z.infer<typeof childProfileSchema>;
export type AccessInviteInput = z.infer<typeof accessInviteSchema>;
export type MedicalNoteInput = z.infer<typeof medicalNoteSchema>;
export type SupportNoteInput = z.infer<typeof supportNoteSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type VideoVisitInput = z.infer<typeof videoVisitSchema>;
export type GardenTaskInput = z.infer<typeof gardenTaskSchema>;
export type QuestionnaireResponseInput = z.infer<typeof questionnaireResponseSchema>;
