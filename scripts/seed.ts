import "dotenv/config";
import { MongoClient } from "mongodb";
import seedData from "../data/seedPattern.json";
import { patternSchema, drillHoleSchema } from "../lib/validations/drillPattern";

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI in .env.local");
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("drill_blast_portfolio");

    // 1. Validate & upsert the Pattern
    const validPattern = patternSchema.parse(seedData.pattern);
    await db.collection("patterns").deleteMany({ shotId: validPattern.shotId });

    const patternResult = await db.collection("patterns").insertOne({
      ...validPattern,
      createdAt: new Date(),
    });

    const patternId = patternResult.insertedId;

    // 2. Validate & insert all 16 Drill Holes
    const validHoles = seedData.holes.map((hole) => {
      const parsed = drillHoleSchema.parse({
        ...hole,
        patternId: patternId.toString(),
      });
      return {
        ...parsed,
        patternId, // Store as MongoDB ObjectId
        updatedAt: new Date(),
      };
    });

    await db.collection("drill_holes").deleteMany({ patternId });
    const holesResult = await db.collection("drill_holes").insertMany(validHoles);

    // 3. Create compound unique index
    await db
      .collection("drill_holes")
      .createIndex({ patternId: 1, holeId: 1 }, { unique: true });

    console.log(
      `Seeded pattern ${validPattern.shotId} with ${holesResult.insertedCount} drill holes.`
    );
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
