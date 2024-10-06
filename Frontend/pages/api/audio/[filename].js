import { MongoClient } from "mongodb";
import { GridFSBucket } from "mongodb";

const uri =
  "URI";

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  console.log("Connecting to database");
  if (cachedClient && cachedDb) {
    console.log("Using cached database connection");
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    console.log("Connected to MongoDB");
    const db = client.db("mydatabase");

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;  // Re-throw to handle in the calling function
  }
}

export default async function handler(req, res) {
  console.log("API handler called");
  if (req.method === "GET") {
    const { filename } = req.query;
    console.log("Requested filename:", filename);

    try {
      const { db } = await connectToDatabase();
      console.log("Connected to database");

      const bucket = new GridFSBucket(db);
      console.log("Created GridFSBucket");

      // Check if the file exists before trying to download
      const file = await bucket.find({ filename: filename }).next();
      console.log("File found:", file ? "Yes" : "No");

      if (!file) {
        console.log("File not found in GridFS");
        return res.status(404).json({ error: "File not found in database" });
      }

      console.log("File metadata:", JSON.stringify(file, null, 2));

      console.log("Attempting to open download stream");
      const downloadStream = bucket.openDownloadStreamByName(filename);

      res.setHeader("Content-Type", file.contentType || "audio/mpeg");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

      console.log("Headers set, piping download stream to response");

      downloadStream.on("error", (error) => {
        console.error("Error in download stream:", error);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error streaming file", details: error.message });
        }
      });

      downloadStream.on("end", () => {
        console.log("Download stream ended successfully");
      });

      res.on("error", (error) => {
        console.error("Error in response stream:", error);
      });

      res.on("finish", () => {
        console.log("Response finished");
      });

      downloadStream.pipe(res);
    } catch (error) {
      console.error("Caught error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  } else {
    console.log("Method not allowed:", req.method);
    res.status(405).json({ error: "Method not allowed" });
  }
}
