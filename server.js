const http = require("http");
const fs = require("fs");
const path = require("path");

// Set a port number
const port = process.env.MINA_EXPLORER_PORT ?? 3000;

// Create a server
const server = http.createServer((req, res) => {
  // Build the file path
  let filePath = path.join(
    __dirname,
    req.url === "/"
      ? "index.html"
      : new URL(req.url, `http://${req.headers.host}`).pathname
  );

  // Get the file's extension
  const extName = String(path.extname(filePath)).toLowerCase();

  // Mime types mapping
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".png": "image/png",
    // Add more mime types for other file extensions as needed
  };

  // Default to octet-stream if the mime type is unknown
  const contentType = mimeTypes[extName] || "application/octet-stream";

  // Read the file from the filesystem
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code == "ENOENT") {
        // If the file is not found, set a 404 status
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("404: File Not Found", "utf-8");
      } else {
        // If there's a server error, set a 500 status
        res.writeHead(500);
        res.end(
          `Sorry, check with the site admin for error: ${error.code} ..\n`
        );
      }
    } else {
      // If the file is found, set the content type and send the content
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content, "utf-8");
    }
  });
});

// Start the server on the specified port
server.listen(port, () => {
  console.log(`⚡️Server is running at http://localhost:${port}/`);
});
