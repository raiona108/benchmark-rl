"use server";

import { revalidatePath } from "next/cache";
import { drillPatternInputSchema } from "@/lib/schemas/drill-pattern";
import { createDrillPattern, seedSamplePatterns } from "@/db/drill-patterns";

export async function addDrillPatternAction(formData: FormData) {
  const raw = {
    patternId: formData.get("patternId"),
    pitName: formData.get("pitName"),
    benchName: formData.get("benchName"),
    mineral: formData.get("mineral"),
    rockType: formData.get("rockType"),
    collarRl: formData.get("collarRl"),
    targetToeRl: formData.get("targetToeRl"),
    subdrill: formData.get("subdrill"),
    burden: formData.get("burden"),
    spacing: formData.get("spacing"),
    holeDiameterMm: formData.get("holeDiameterMm"),
    drillRigId: formData.get("drillRigId") || undefined,
    powderFactor: formData.get("powderFactor")
      ? formData.get("powderFactor")
      : undefined,
    plannedHoles: formData.get("plannedHoles"),
    drilledHoles: formData.get("drilledHoles") || 0,
    status: formData.get("status") || "Planned",
    notes: formData.get("notes") || undefined,
  };

  const parsed = drillPatternInputSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  await createDrillPattern(parsed.data);
  revalidatePath("/");
  return { ok: true };
}

export async function seedPatternsAction() {
  await seedSamplePatterns();
  revalidatePath("/");
}
