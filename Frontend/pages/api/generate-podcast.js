export default async function handler(req, res) {
  console.log("before if")
  if (req.method === "POST") {
    console.log("Received podcast generation request");
    const { endpoint, topic, character } = req.body;
    console.log("Request body:", { endpoint, topic, character });

    try {
      const externalApiUrl = `http://127.0.0.1:5000${endpoint}`;
      console.log("Sending request to external API:", externalApiUrl);

      let requestBody;
      // if (endpoint === "/one_person") {
      //   requestBody = { topic, character };
      // } else if (endpoint === "/two_person") {
      //   requestBody = { topic };
      // } else {
      //   throw new Error("Invalid endpoint");
      // }

      console.log("Request body:", requestBody);

      const response = await fetch(externalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("External API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("External API response data:", data);

        // Assuming the external API returns a filename in the response
        const filename = data.filename || "generated_podcast.mp3";
        res.status(200).json({ filename });
      } else {
        let errorMessage = "Failed to generate podcast";
        let statusCode = response.status;

        switch (statusCode) {
          case 400:
            errorMessage = "Bad request: Invalid input parameters";
            break;
          case 401:
            errorMessage = "Unauthorized: Authentication failed";
            break;
          case 403:
            errorMessage =
              "Forbidden: You don't have permission to access this resource";
            break;
          case 404:
            errorMessage = "Not found: The requested resource doesn't exist";
            break;
          case 429:
            errorMessage = "Too many requests: Please try again later";
            break;
          case 500:
            errorMessage =
              "Internal server error: Something went wrong on the server";
            break;
          default:
            if (statusCode >= 500) {
              errorMessage = "Server error: Something went wrong on the server";
            } else {
              errorMessage = "An unexpected error occurred";
            }
        }

        console.error(`External API error: ${errorMessage}`);
        res.status(statusCode).json({ error: errorMessage });
      }
    } catch (error) {
      console.error("Error generating podcast:", error);
      res
        .status(500)
        .json({ error: "Failed to generate podcast: " + error.message });
    }
  } else {
    console.log("Method not allowed:", req.method);
    res.status(405).json({ error: "Method not allowed" });
  }
}
