import { MongoClient } from "mongodb";
import { GridFSBucket } from "mongodb";

const uri = "URI"
  

export default async function handler(req, res) {
  console.log("List files handler called");

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db("mydatabase");
    const bucket = new GridFSBucket(db);

    const files = await bucket.find().toArray();
    console.log("Files found:", files.length);

    res.status(200).json({
      files: files.map((file) => ({
        filename: file.filename,
        length: file.length,
        uploadDate: file.uploadDate,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
