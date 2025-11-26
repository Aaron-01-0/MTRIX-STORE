import { z } from 'zod';

// Authentication validation schemas
export const signUpSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(100, { message: "Password must be less than 100 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
  confirmPassword: z.string(),
  firstName: z.string()
    .trim()
    .min(1, { message: "First name is required" })
    .max(50, { message: "First name must be less than 50 characters" }),
  lastName: z.string()
    .trim()
    .min(1, { message: "Last name is required" })
    .max(50, { message: "Last name must be less than 50 characters" }),
  mobileNo: z.string()
    .regex(/^[0-9]{10}$/, { message: "Mobile number must be exactly 10 digits" })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string()
    .trim()
    .email({ message: "Invalid email address" })
    .max(255, { message: "Email must be less than 255 characters" }),
  password: z.string()
    .min(1, { message: "Password is required" })
});

// Address validation schema
export const addressSchema = z.object({
  address_line_1: z.string()
    .trim()
    .min(5, { message: "Address must be at least 5 characters" })
    .max(200, { message: "Address must be less than 200 characters" }),
  address_line_2: z.string()
    .trim()
    .max(200, { message: "Address must be less than 200 characters" })
    .optional(),
  city: z.string()
    .trim()
    .min(2, { message: "City must be at least 2 characters" })
    .max(100, { message: "City must be less than 100 characters" }),
  pincode: z.string()
    .regex(/^[0-9]{6}$/, { message: "Pincode must be exactly 6 digits" }),
  state: z.string()
    .trim()
    .min(2, { message: "State must be at least 2 characters" })
    .max(100, { message: "State must be less than 100 characters" })
    .optional(),
  district: z.string()
    .trim()
    .max(100, { message: "District must be less than 100 characters" })
    .optional()
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
