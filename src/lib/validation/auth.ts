import { z } from "zod";

/**
 * Messages are written for a Grade 9 student, not a developer: say what to do,
 * never what the validator was called.
 */

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(32, "Username must be 32 characters or fewer.")
  .regex(
    /^[a-zA-Z0-9._-]+$/,
    "Username can only use letters, numbers, dots, dashes, and underscores.",
  );

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

export const loginSchema = z.object({
  // Accepts either the email or the username; the server resolves which.
  identifier: z.string().trim().min(1, "Enter your username or email."),
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Enter your full name.")
      .max(120, "That name is too long."),
    email: z.string().trim().toLowerCase().pipe(
      z.email("Enter a valid email address."),
    ),
    username: usernameSchema,
    sectionId: z.string().uuid().optional().or(z.literal("")),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "The two passwords do not match.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
