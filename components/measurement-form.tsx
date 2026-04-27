import { Sprout } from "lucide-react";
import { createMeasurement } from "@/app/actions/measurements";

type PlantOption = {
  id: string;
  name: string;
};

export function MeasurementForm({ plants }: { plants: PlantOption[] }) {
  const now = new Date();
  const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <form action={createMeasurement} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          测量时间
          <input
            type="datetime-local"
            name="measuredAt"
            defaultValue={localDateTime}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-leaf"
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          类型
          <select
            name="label"
            defaultValue="晚上"
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-leaf"
          >
            <option value="晚上">晚上</option>
            <option value="早上">早上</option>
            <option value="一天">一天</option>
            <option value="浇水">浇水</option>
            <option value="部分浇水">部分浇水</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {plants.map((plant) => (
          <label key={plant.id} className="rounded-md border border-slate-200 bg-white p-3">
            <input type="hidden" name="plantId" value={plant.id} />
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sprout className="h-4 w-4 text-leaf" />
              {plant.name}
            </span>
            <input
              type="number"
              step="0.1"
              min="0"
              name="weight"
              placeholder="重量 g"
              className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-leaf"
            />
          </label>
        ))}
      </div>

      <label className="block space-y-2 text-sm font-medium text-slate-700">
        备注
        <textarea
          name="note"
          rows={3}
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-leaf"
          placeholder="换盆、补光、浇水量等"
        />
      </label>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-leaf px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-[#286b50]"
      >
        <Sprout className="h-4 w-4" />
        保存记录
      </button>
    </form>
  );
}
