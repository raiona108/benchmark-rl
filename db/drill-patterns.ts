import clientPromise from "@/lib/mongodb";
import {
  DrillPatternDocument,
  DrillPatternInput,
} from "@/lib/schemas/drill-pattern";

const COLLECTION_NAME = "drill_patterns";

async function getCollection() {
  if (!clientPromise) {
    throw new Error("MONGODB_URI environment variable is not configured");
  }
  const client = await clientPromise;
  // Uses the default database specified in MONGODB_URI
  const db = client.db();
  return db.collection<Omit<DrillPatternDocument, "_id">>(COLLECTION_NAME);
}

export async function getDrillPatterns(): Promise<DrillPatternDocument[]> {
  const collection = await getCollection();
  const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();

  return docs.map((doc) => ({
    ...doc,
    _id: doc._id.toString(),
  }));
}

export async function createDrillPattern(
  input: DrillPatternInput
): Promise<DrillPatternDocument> {
  const collection = await getCollection();
  const now = new Date();
  const benchHeight = Number((input.collarRl - input.targetToeRl).toFixed(2));

  const newDoc: Omit<DrillPatternDocument, "_id"> = {
    ...input,
    benchHeight,
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(newDoc);

  return {
    ...newDoc,
    _id: result.insertedId.toString(),
  };
}

export async function seedSamplePatterns(): Promise<number> {
  const collection = await getCollection();
  const existingCount = await collection.countDocuments();
  if (existingCount > 0) return 0;

  const now = new Date();
  const samples: Array<Omit<DrillPatternDocument, "_id">> = [
    {
        patternId: "P-420-014",
        pitName: "North Pit",
        benchName: "420 Bench",
        collarRl: 420.5,
        targetToeRl: 408.5,
        subdrill: 1.5,
        benchHeight: 12.0,
        burden: 4.5,
        spacing: 5.2,
        holeDiameterMm: 229,
        rockType: "BIF",
        drillRigId: "PV271-02",
        powderFactor: 0.92,
        plannedHoles: 140,
        drilledHoles: 98,
        status: "Drilling",
        notes: "Hard band encountered at 8m depth on western edge.",
        createdAt: now,
        updatedAt: now,
        mineral: "ore"
    },
    {
      patternId: "P-408-009",
      pitName: "North Pit",
      benchName: "408 Bench",
      collarRl: 408.5,
      targetToeRl: 396.5,
      subdrill: 1.2,
      benchHeight: 12.0,
      burden: 4.0,
      spacing: 4.8,
      holeDiameterMm: 165,
      rockType: "Fresh Basalt",
      drillRigId: "DR-04",
      powderFactor: 0.85,
      plannedHoles: 85,
      drilledHoles: 85,
      status: "Ready to Charge",
      notes: "Dipped and cleared by shotfirer; 4 wet holes flagged.",
      createdAt: now,
      updatedAt: now,
      mineral: "ore"
    },
    {
      patternId: "P-390-021",
      pitName: "South Cutback",
      benchName: "390 Bench",
      collarRl: 390.0,
      targetToeRl: 380.0,
      subdrill: 1.0,
      benchHeight: 10.0,
      burden: 5.0,
      spacing: 5.5,
      holeDiameterMm: 165,
      rockType: "Oxide Waste",
      drillRigId: "DR-02",
      powderFactor: 0.62,
      plannedHoles: 110,
      drilledHoles: 0,
      status: "Planned",
      notes: "Collar survey pegged and ready for rig mobilization.",
      createdAt: now,
      updatedAt: now,
      mineral: "ore"
    },
  ];

  const result = await collection.insertMany(samples);
  return result.insertedCount;
}
