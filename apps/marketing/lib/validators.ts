import { z } from "zod";
import { isValidStoreUrl } from "./tools/scraper";

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
          const parsed = new URL(url)
          return parsed.protocol === "http:" || parsed.protocol === "https:"
        } catch {
          return false
        }
      },
      { message: "URL must start with http:// or https://" }
    ),
})

export type OfferSnapshotInput = z.infer<typeof offerSnapshotSchema>

/**
 * Offer Snapshot preview (crawl actions) request validation
 */
export const offerSnapshotPreviewSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .transform((val) => (val.startsWith("http://") || val.startsWith("https://") ? val : `https://${val}`))
    .refine(isValidStoreUrl, { message: "Invalid URL format" }),
  prompt: z
    .string()
    .min(1, "Prompt is required for preview")
    .transform((s) => s.trim())
    .refine((s) => s.length > 0, "Prompt cannot be empty"),
});

export type OfferSnapshotPreviewInput = z.infer<typeof offerSnapshotPreviewSchema>

/**
 * Discount Detector tool — POST body
 */
export const discountDetectorRequestSchema = z.object({
  url: z
    .string()
    .min(1, "URL is required")
    .transform((val) =>
      val.startsWith("http://") || val.startsWith("https://") ? val : `https://${val}`,
    )
    .refine(isValidStoreUrl, { message: "Invalid URL format" }),
});

export type DiscountDetectorRequestInput = z.infer<typeof discountDetectorRequestSchema>;

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
})

export type SignUpInput = z.infer<typeof signUpSchema>

/**
 * Sign in form validation
 */
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

export type SignInInput = z.infer<typeof signInSchema>

/**
 * Contact form validation (for future use)
 */
export const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

export type ContactInput = z.infer<typeof contactSchema>
