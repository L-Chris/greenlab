import { Droplets, Thermometer, TrendingUp, Wind } from "lucide-react";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { fixed, percent, toNumber } from "@/lib/format";
import { EnvironmentChart } from "@/components/environment-chart";
import { MeasurementChart } from "@/components/measurement-chart";
import { MeasurementForm } from "@/components/measurement-form";

export const dynamic = "force-dynamic";

const starterPlants = ["姬星美人", "熊童子", "白玉虎皮兰", "莎莎女王", "绿萝", "三角梅"];

type MeasurementChartRow = {
  ts: number;
  [plantName: string]: string | number | null;
};

type VpdStatus = {
  description: string;
  tone: string;
};

function calculateVpd(temperature: number | null, humidity: number | null) {
  if (temperature === null || humidity === null) return null;
  if (humidity < 0 || humidity > 100) return null;

  const saturationVaporPressure = 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
  return saturationVaporPressure * (1 - humidity / 100);
}

function getVpdStatus(vpd: number | null): VpdStatus {
  if (vpd === null) {
    return {
      description: "缺少温湿度数据，暂时无法判断蒸腾驱动力。",
      tone: "text-slate-500"
    };
  }

  if (vpd < 0.4) {
    return {
      description: "空气偏湿，蒸腾拉力较弱，叶面水分释放会比较慢。",
      tone: "text-sky-700"
    };
  }

  if (vpd < 0.8) {
    return {
      description: "蒸腾比较平缓，环境柔和，适合恢复期或根系偏弱时观察。",
      tone: "text-cyan-700"
    };
  }

  if (vpd < 1.2) {
    return {
      description: "处在相对舒适区，气孔交换和水分消耗通常更均衡。",
      tone: "text-emerald-700"
    };
  }

  if (vpd < 1.6) {
    return {
      description: "蒸腾开始变快，盆土消耗会上升，适合关注缺水节奏。",
      tone: "text-amber-700"
    };
  }

  return {
    description: "空气偏干，蒸腾压力较高，需要留意叶片失水和补水策略。",
    tone: "text-rose-700"
  };
}

async function ensurePlants() {
  const count = await prisma.plant.count();
  if (count > 0) return;

  await Promise.all(
    starterPlants.map((name, index) =>
      prisma.plant.create({
        data: {
          name,
          displayOrder: index
        }
      })
    )
  );
}

export default async function Home() {
  await ensurePlants();

  const [plants, sessions, environment, latestSync] = await Promise.all([
    prisma.plant.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }]
    }),
    prisma.measurementSession.findMany({
      take: 30,
      orderBy: { measuredAt: "desc" },
      include: {
        measurements: {
          include: { plant: true },
          orderBy: { plant: { displayOrder: "asc" } }
        }
      }
    }),
    prisma.environmentReading.findMany({
      take: 240,
      orderBy: { recordedAt: "desc" }
    }),
    prisma.syncLog.findFirst({
      where: { source: "homeassistant" },
      orderBy: { startedAt: "desc" }
    })
  ]);

  const orderedSessions = [...sessions].reverse();
  const chartRows: MeasurementChartRow[] = orderedSessions.map((session) => {
    const row: MeasurementChartRow = {
      ts: session.measuredAt.getTime()
    };

    for (const measurement of session.measurements) {
      row[measurement.plant.name] = toNumber(measurement.weight);
    }

    return row;
  });

  const environmentRows = [...environment]
    .reverse()
    .reduce<Record<string, { time: string; temperature?: number | null; humidity?: number | null }>>(
      (acc, reading) => {
        const key = format(reading.recordedAt, "MM-dd HH:mm");
        acc[key] = acc[key] || { time: key };
        if (reading.kind === "temperature") acc[key].temperature = toNumber(reading.value);
        if (reading.kind === "humidity") acc[key].humidity = toNumber(reading.value);
        return acc;
      },
      {}
    );

  const latestSession = sessions[0];
  const latestTemperature = environment.find((item) => item.kind === "temperature");
  const latestHumidity = environment.find((item) => item.kind === "humidity");
  const latestTemperatureValue = toNumber(latestTemperature?.value);
  const latestHumidityValue = toNumber(latestHumidity?.value);
  const latestVpd = calculateVpd(latestTemperatureValue, latestHumidityValue);
  const vpdStatus = getVpdStatus(latestVpd);
  const vpdTimestamp = latestTemperature?.recordedAt || latestHumidity?.recordedAt;

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-leaf">GreenLab</p>
            <h1 className="mt-2 text-3xl font-bold text-ink md:text-5xl">植物数据记录台</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              记录每次重量变化、浇水事件和 Home Assistant 环境数据，先把表格里的观察变成连续的趋势。
            </p>
          </div>
          <div className="rounded-md border border-white/70 bg-white/75 px-4 py-3 text-sm text-slate-600 shadow-soft backdrop-blur">
            <span className="font-semibold text-slate-800">HA 同步：</span>
            {latestSync
              ? `${latestSync.status} · ${format(latestSync.startedAt, "MM-dd HH:mm")}`
              : "尚未同步"}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-3">
          <Metric
            icon={<Thermometer className="h-5 w-5" />}
            label="温度"
            value={latestTemperature ? `${fixed(latestTemperatureValue, 1)}${latestTemperature.unit || ""}` : "-"}
            hint={latestTemperature ? format(latestTemperature.recordedAt, "MM-dd HH:mm") : "等待 HA 数据"}
          />
          <Metric
            icon={<Droplets className="h-5 w-5" />}
            label="湿度"
            value={latestHumidity ? `${fixed(latestHumidityValue, 1)}${latestHumidity.unit || ""}` : "-"}
            hint={latestHumidity ? format(latestHumidity.recordedAt, "MM-dd HH:mm") : "可配置湿度实体"}
          />
          <Metric
            icon={<Wind className="h-5 w-5" />}
            label="VPD"
            value={latestVpd === null ? "-" : `${fixed(latestVpd, 2)} kPa`}
            hint={vpdTimestamp ? format(vpdTimestamp, "MM-dd HH:mm") : "等待最新温湿度数据"}
            description={vpdStatus.description}
            descriptionTone={vpdStatus.tone}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-ink">重量趋势</h2>
                <p className="text-sm text-slate-500">单位：g</p>
              </div>
              <TrendingUp className="h-5 w-5 text-leaf" />
            </div>
            <MeasurementChart data={chartRows} plantNames={plants.map((plant) => plant.name)} />
          </div>

          <div className="rounded-lg border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur">
            <h2 className="text-lg font-bold text-ink">新增记录</h2>
            <p className="mb-4 text-sm text-slate-500">自动计算相对上一次的重量变化和比例</p>
            <MeasurementForm plants={plants.map((plant) => ({ id: plant.id, name: plant.name }))} />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-lg border border-white/80 bg-white/85 p-5 shadow-soft backdrop-blur">
            <h2 className="text-lg font-bold text-ink">温湿度</h2>
            <p className="mb-4 text-sm text-slate-500">由 Home Assistant history API 定期写入</p>
            <EnvironmentChart data={Object.values(environmentRows)} />
          </div>

          <div className="overflow-hidden rounded-lg border border-white/80 bg-white/85 shadow-soft backdrop-blur">
            <div className="border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-ink">最近记录</h2>
            </div>
            <div className="max-h-[360px] overflow-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">时间</th>
                    <th className="px-4 py-3">类型</th>
                    <th className="px-4 py-3">植物</th>
                    <th className="px-4 py-3">重量 g</th>
                    <th className="px-4 py-3">变化 g</th>
                    <th className="px-4 py-3">比例</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sessions.flatMap((session) =>
                    session.measurements.map((measurement) => (
                      <tr key={measurement.id} className="hover:bg-mint/50">
                        <td className="px-4 py-3 text-slate-600">{format(session.measuredAt, "MM-dd HH:mm")}</td>
                        <td className="px-4 py-3 text-slate-600">{session.label || "-"}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">{measurement.plant.name}</td>
                        <td className="px-4 py-3">{fixed(toNumber(measurement.weight), 1)}</td>
                        <td className="px-4 py-3">{fixed(toNumber(measurement.delta), 1)}</td>
                        <td className="px-4 py-3">{percent(toNumber(measurement.deltaPercent))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({
  icon,
  label,
  value,
  hint,
  description,
  descriptionTone
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  description?: string;
  descriptionTone?: string;
}) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/85 p-4 shadow-soft backdrop-blur">
      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-mint text-leaf">{icon}</div>
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-ink">{value}</div>
      {description ? <div className={`mt-2 text-sm font-medium ${descriptionTone || "text-slate-600"}`}>{description}</div> : null}
      <div className="mt-2 text-xs text-slate-500">{hint}</div>
    </div>
  );
}
