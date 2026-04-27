import { prisma } from "../lib/prisma";
import { syncHomeAssistantHistory } from "../lib/homeassistant";

async function main() {
  const log = await prisma.syncLog.create({
    data: {
      source: "homeassistant",
      status: "running"
    }
  });

  try {
    const hours = Number(process.env.HA_SYNC_LOOKBACK_HOURS || 24);
    const to = new Date();
    const from = new Date(to.getTime() - hours * 60 * 60 * 1000);
    const result = await syncHomeAssistantHistory(from, to);

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "success",
        finishedAt: new Date(),
        rowsInserted: result.inserted,
        message: `Synced ${result.entities} entities`
      }
    });

    console.log(
      `Synced ${result.inserted} readings from ${result.entities} entities between ${result.from.toISOString()} and ${result.to.toISOString()}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        message
      }
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
