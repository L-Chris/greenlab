"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const measurementSchema = z.object({
  measuredAt: z.string().min(1),
  label: z.string().optional(),
  note: z.string().optional(),
  values: z.array(
    z.object({
      plantId: z.string().min(1),
      weight: z.coerce.number().positive().optional()
    })
  )
});

export async function createMeasurement(formData: FormData) {
  const plantIds = formData.getAll("plantId").map(String);
  const weights = formData.getAll("weight").map(String);

  const parsed = measurementSchema.parse({
    measuredAt: String(formData.get("measuredAt") || ""),
    label: String(formData.get("label") || ""),
    note: String(formData.get("note") || ""),
    values: plantIds.map((plantId, index) => ({
      plantId,
      weight: weights[index] ? Number(weights[index]) : undefined
    }))
  });

  const rows = parsed.values.filter((value) => value.weight);
  if (!rows.length) return;

  await prisma.$transaction(async (tx) => {
    const session = await tx.measurementSession.create({
      data: {
        measuredAt: new Date(parsed.measuredAt),
        label: parsed.label,
        note: parsed.note
      }
    });

    for (const row of rows) {
      const previous = await tx.plantMeasurement.findFirst({
        where: {
          plantId: row.plantId,
          session: {
            measuredAt: {
              lt: session.measuredAt
            }
          }
        },
        orderBy: {
          session: {
            measuredAt: "desc"
          }
        }
      });

      const weight = row.weight as number;
      const previousWeight = previous ? Number(previous.weight) : null;
      const delta = previousWeight === null ? null : weight - previousWeight;
      const deltaPercent = previousWeight && delta !== null ? delta / previousWeight : null;

      await tx.plantMeasurement.create({
        data: {
          sessionId: session.id,
          plantId: row.plantId,
          weight,
          delta,
          deltaPercent
        }
      });
    }
  });

  revalidatePath("/");
}
