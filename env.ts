import { z } from "zod";

export const envSchema = z.object({
  // Server-only variables
  server: {
    FAL_KEY: z.string(),
  },
  // For client-side variables (none for now)
  client: {
    // Add client-side variables here if needed
  },
  experimental__runtimeEnv: {
    // Add client-side runtime variables here if needed
  }
});
