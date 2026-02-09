import { z } from "zod";

/**
 * Offer Snapshot request validation
 */
export const offerSnapshotSchema = z.object({
  url: z
    .string()
    .min(1, "Please enter a URL")
    .url("Please enter a valid URL")
    .refine(
      (url) => {
        try {
          const parsed = new URL(url);
          return parsed.protocol === "http:" || parsed.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "URL must start with http:// or https://" }
    ),
});

export type OfferSnapshotInput = z.infer<typeof offerSnapshotSchema>;

/**
 * Sign up form validation
 */
export const signUpSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  storeUrl: z
    .string()
    .url("Please enter a valid store URL")
    .optional()
    .or(z.literal("")),
  competitorUrl: z
    .string()
    .url("Please enter a valid competitor URL")
    .optional()
    .or(z.literal("")),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

/**
 * Sign in form validation
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

/**
 * Competitor URL validation
 */
export const competitorUrlSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .url("Please enter a valid URL"),
  name: z.string().min(1, "Name is required").max(100),
});

export type CompetitorUrlInput = z.infer<typeof competitorUrlSchema>;
