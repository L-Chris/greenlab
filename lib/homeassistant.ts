import { prisma } from "./prisma";

type HistoryState = {
  entity_id: string;
  state: string;
  attributes?: {
    unit_of_measurement?: string;
    device_class?: string;
    friendly_name?: string;
  };
  last_changed?: string;
  last_updated?: string;
};

export type HomeAssistantSyncResult = {
  inserted: number;
  entities: number;
  from: Date;
  to: Date;
};

const defaultTemperatureEntity =
  "sensor.lumi_cn_lumi_158d008b80866d_v1_temperature_p_2_1";

function entityList() {
  return (process.env.HA_ENTITY_IDS || defaultTemperatureEntity)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function readingKind(entityId: string, state: HistoryState) {
  const deviceClass = state.attributes?.device_class?.toLowerCase();
  if (deviceClass === "temperature" || entityId.includes("temperature")) return "temperature";
  if (deviceClass === "humidity" || entityId.includes("humidity")) return "humidity";
  return "sensor";
}

function historyUrl(baseUrl: string, entityId: string, from: Date, to: Date) {
  const url = new URL(`/api/history/period/${from.toISOString()}`, baseUrl);
  url.searchParams.set("filter_entity_id", entityId);
  url.searchParams.set("end_time", to.toISOString());
  url.searchParams.set("minimal_response", "");
  return url;
}

export async function syncHomeAssistantHistory(
  from = new Date(Date.now() - 1000 * 60 * 60 * 24),
  to = new Date()
): Promise<HomeAssistantSyncResult> {
  const baseUrl = process.env.HA_BASE_URL || "http://home.home.com";
  const token = process.env.HA_TOKEN;

  if (!token) {
    throw new Error("HA_TOKEN is required for Home Assistant sync");
  }

  let inserted = 0;
  const entities = entityList();

  for (const entityId of entities) {
    const response = await fetch(historyUrl(baseUrl, entityId, from, to), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Home Assistant ${entityId} sync failed: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as HistoryState[][];
    const states = payload.flat();

    for (const state of states) {
      const numeric = Number(state.state);
      const recordedAt = new Date(state.last_updated || state.last_changed || "");

      if (!Number.isFinite(numeric) || Number.isNaN(recordedAt.getTime())) continue;

      const result = await prisma.environmentReading.upsert({
        where: {
          entityId_recordedAt: {
            entityId,
            recordedAt
          }
        },
        update: {
          value: numeric,
          unit: state.attributes?.unit_of_measurement,
          raw: state as object
        },
        create: {
          entityId,
          kind: readingKind(entityId, state),
          value: numeric,
          unit: state.attributes?.unit_of_measurement,
          recordedAt,
          raw: state as object
        }
      });

      if (result.createdAt.getTime() > Date.now() - 1000 * 30) inserted += 1;
    }
  }

  return { inserted, entities: entities.length, from, to };
}
