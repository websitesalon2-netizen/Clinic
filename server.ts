import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "clinic_state.json");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cache backed by disk file
let serverDbCache: any = null;
let lastModifiedTimestamp = Date.now();

function loadDbFromDisk(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Failed to read clinic_state.json from disk:", err);
  }
  return null;
}

function saveDbToDisk(data: any) {
  try {
    serverDbCache = data;
    lastModifiedTimestamp = Date.now();
    data.last_modified_timestamp = lastModifiedTimestamp;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write clinic_state.json to disk:", err);
    return false;
  }
}

// Initialize cache from disk
serverDbCache = loadDbFromDisk();

async function startServer() {
  const app = express();

  // Allow larger payload for image uploads and full database sync
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes FIRST
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: Date.now() });
  });

  // Get shared database state
  app.get("/api/clinic-db", (_req, res) => {
    if (!serverDbCache) {
      serverDbCache = loadDbFromDisk();
    }
    res.json({
      success: true,
      data: serverDbCache,
      timestamp: lastModifiedTimestamp,
    });
  });

  // Update shared database state (from manager or developer or public bookings)
  app.post("/api/clinic-db", (req, res) => {
    const { db } = req.body;
    if (!db) {
      return res.status(400).json({ success: false, error: "Missing db payload" });
    }
    const saved = saveDbToDisk(db);
    if (saved) {
      res.json({ success: true, timestamp: lastModifiedTimestamp });
    } else {
      res.status(500).json({ success: false, error: "Failed to persist database" });
    }
  });

  // Reset database state to clean default
  app.post("/api/reset-db", (_req, res) => {
    if (fs.existsSync(DB_FILE)) {
      try {
        fs.unlinkSync(DB_FILE);
      } catch (e) {
        console.error("Failed to delete DB_FILE:", e);
      }
    }
    serverDbCache = null;
    lastModifiedTimestamp = Date.now();
    res.json({ success: true, message: "Database reset to initial state" });
  });

  // Image Upload helper endpoint
  app.post("/api/upload-image", (req, res) => {
    const { dataUrl, filename } = req.body;
    if (!dataUrl) {
      return res.status(400).json({ success: false, error: "Missing dataUrl" });
    }

    try {
      const uploadsDir = path.join(__dirname, "public", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // If dataUrl matches data:image/..., save binary file
      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const base64Data = matches[2];
        const safeName = (filename || "clinic_pic")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 40);
        const diskName = `${Date.now()}_${safeName}.${ext}`;
        const filePath = path.join(uploadsDir, diskName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        return res.json({ success: true, url: `/uploads/${diskName}` });
      }

      // If already a URL or unable to parse, return dataUrl directly
      return res.json({ success: true, url: dataUrl });
    } catch (err: any) {
      console.error("Image upload error:", err);
      // Fallback: return dataUrl so it can still be saved inside the DB JSON
      return res.json({ success: true, url: dataUrl });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Clinic Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
