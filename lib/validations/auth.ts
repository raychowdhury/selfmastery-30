import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const signUpSchema = credentialsSchema.extend({
  name: z
    .string()
    .trim()
    .min(1, "Tell us what to call you.")
    .max(80, "That name is a little long."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
