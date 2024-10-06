import { MongoClient } from "mongodb";
import { GridFSBucket } from "mongodb";

const uri =
  "URI";

export default async function handler(req, res) {
  if (req.method === "POST") {
    console.log("Received request to empty database");

    try {
      const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      await client.connect();
      console.log("Connected to MongoDB");

      const db = client.db("kdatabase");
      const bucket = new GridFSBucket(db);

      console.log("Deleting all files from GridFS");
      await bucket.drop();

      console.log("Database emptied successfully");
      await client.close();

      res.status(200).json({ message: "Database emptied successfully" });
    } catch (error) {
      console.error("Error emptying database:", error);
      res.status(500).json({ error: "Failed to empty database" });
    }
  } else {
    console.log("Method not allowed:", req.method);
    res.status(405).json({ error: "Method not allowed" });
  }
}
