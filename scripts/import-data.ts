import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface RawRow {
  date: string;
  time: string;
  label: string;
  measurements: Record<string, number | null>;
}

function parseData(filePath: string): RawRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.trim().split("\n");

  const header = lines[0].split("\t");
  const plantNames = header.slice(3);

  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split("\t");
    if (cols.length < 4) continue;

    const date = cols[0]?.trim();
    const time = cols[1]?.trim();
    const label = cols[2]?.trim();

    if (!date || !time) continue;

    const measurements: Record<string, number | null> = {};
    for (let j = 0; j < plantNames.length; j++) {
      const raw = cols[3 + j]?.trim();
      if (raw && raw !== "") {
        const cleaned = raw.endsWith(".") ? raw.slice(0, -1) : raw;
        const num = parseFloat(cleaned);
        measurements[plantNames[j].trim()] = Number.isNaN(num) ? null : num;
      } else {
        measurements[plantNames[j].trim()] = null;
      }
    }

    rows.push({ date, time, label, measurements });
  }

  return rows;
}

function parseDateTime(dateStr: string, timeStr: string): Date {
  const [year, month, day] = dateStr.split("/").map(Number);
  const [hour, minute, second] = timeStr.split(":").map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

async function main() {
  const dataPath = path.resolve(__dirname, "../data.txt");
  const rows = parseData(dataPath);
  console.log(`Parsed ${rows.length} rows\n`);

  // Ensure plants exist
  const plantMap = new Map<string, string>();
  for (const row of rows) {
    for (const name of Object.keys(row.measurements)) {
      if (!plantMap.has(name)) {
        let plant = await prisma.plant.findFirst({ where: { name } });
        if (!plant) {
          plant = await prisma.plant.create({
            data: { name, displayOrder: plantMap.size },
          });
          console.log(`Created plant: ${name}`);
        }
        plantMap.set(name, plant.id);
      }
    }
  }

  const lastWeight = new Map<string, number>();

  for (const row of rows) {
    const measuredAt = parseDateTime(row.date, row.time);

    const session = await prisma.measurementSession.create({
      data: {
        measuredAt,
        label: row.label,
      },
    });

    for (const [plantName, weight] of Object.entries(row.measurements)) {
      if (weight === null) continue;

      const plantId = plantMap.get(plantName)!;
      const prevWeight = lastWeight.get(plantId);

      let delta: number | null = null;
      let deltaPercent: number | null = null;

      if (prevWeight !== undefined) {
        delta = weight - prevWeight;
        deltaPercent = (delta / prevWeight) * 100;
      }

      await prisma.plantMeasurement.create({
        data: {
          sessionId: session.id,
          plantId,
          weight,
          delta: delta !== null ? Math.round(delta * 100) / 100 : null,
          deltaPercent: deltaPercent !== null ? Math.round(deltaPercent * 10000) / 10000 : null,
        },
      });

      lastWeight.set(plantId, weight);
    }

    console.log(`  ${row.date} ${row.time} [${row.label}]`);
  }

  console.log(`\nDone — imported ${rows.length} sessions.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
