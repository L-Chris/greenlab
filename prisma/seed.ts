import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plants = ["姬星美人", "熊童子", "白玉虎皮兰", "莎莎女王", "绿萝", "三角梅"];

async function main() {
  await Promise.all(
    plants.map((name, index) =>
      prisma.plant.upsert({
        where: { id: `seed-${index + 1}` },
        update: { name, displayOrder: index },
        create: { id: `seed-${index + 1}`, name, displayOrder: index }
      })
    )
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
