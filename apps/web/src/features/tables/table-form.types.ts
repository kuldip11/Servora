import { tableFormSchema } from "@pos/validation";
import type { z } from "zod";

export type TableFormValues = z.input<typeof tableFormSchema>;
