import { MongoClient } from "mongodb";
import { GridFSBucket } from "mongodb";

const uri =
  "URI";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  const db = client.db("mydatabase");

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  console.log("File metadata handler called");

  try {
    const { db } = await connectToDatabase();
    console.log("Connected to MongoDB");

    const bucket = new GridFSBucket(db);

    const filename = req.query.filename;
    console.log("Searching for file:", filename);

    const file = await bucket.find({ filename: filename }).next();

    if (!file) {
      console.log("File not found:", filename);
      return res.status(404).json({ error: "File not found" });
    }

    console.log("File found:", filename);
    console.log("File metadata:", JSON.stringify(file, null, 2));

    res.status(200).json({
      filename: file.filename,
      length: file.length,
      chunkSize: file.chunkSize,
      uploadDate: file.uploadDate,
      md5: file.md5,
      contentType: file.contentType,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
}
