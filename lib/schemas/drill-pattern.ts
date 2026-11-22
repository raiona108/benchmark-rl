import { z } from "zod";

export const PATTERN_STATUSES = [
  "Planned",
  "Drilling",
  "Ready to Charge",
  "Charged",
  "Fired",
] as const;

export const MINERAL_TYPES = [
  "Iron Ore",
  "Gold",
  "Lithium",
  "Nickel",
  "Copper",
  "Overburden / Waste",
] as const;

export const drillPatternInputSchema = z
  .object({
    patternId: z.string().trim().min(1, "Pattern ID is required"),
    pitName: z.string().trim().min(1, "Pit name is required"),
    benchName: z.string().trim().min(1, "Bench name is required"),
    mineral: z.string().trim().min(1, "Mineral / material type is required"),
    rockType: z.string().trim().min(1, "Rock type is required"),
    collarRl: z.coerce.number(),
    targetToeRl: z.coerce.number(),
    subdrill: z.coerce.number().min(0, "Subdrill cannot be negative"),
    burden: z.coerce.number().positive("Burden must be greater than 0"),
    spacing: z.coerce.number().positive("Spacing must be greater than 0"),
    holeDiameterMm: z.coerce
      .number()
      .int()
      .positive("Hole diameter must be a positive integer"),
    drillRigId: z.string().trim().optional(),
    powderFactor: z.coerce.number().min(0).optional(),
    plannedHoles: z.coerce.number().int().min(1, "At least 1 hole is required"),
    drilledHoles: z.coerce.number().int().min(0).default(0),
    status: z.enum(PATTERN_STATUSES).default("Planned"),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.collarRl > data.targetToeRl, {
    message: "Collar RL must be higher than Target Toe RL",
    path: ["targetToeRl"],
  })
  .refine((data) => data.drilledHoles <= data.plannedHoles, {
    message: "Drilled holes cannot exceed planned holes",
    path: ["drilledHoles"],
  });

export type DrillPatternInput = z.infer<typeof drillPatternInputSchema>;

export interface DrillPatternDocument extends DrillPatternInput {
  _id?: string;
  benchHeight: number;
  createdAt: Date;
  updatedAt: Date;
}
