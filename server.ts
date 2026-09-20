import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
// Use process.cwd() so paths remain consistent in both dev and production bundled builds
const ROOT_DIR = process.cwd();
const DATA_DIR = path.join(ROOT_DIR, "data");
const DB_FILE = path.join(DATA_DIR, "clinic_state.json");
const UPLOADS_DIR = path.join(ROOT_DIR, "public", "uploads");

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-memory cache backed by disk file
let serverDbCache: any = null;
let lastModifiedTimestamp = Date.now();

// SSE Connected Clients
let sseClients: express.Response[] = [];

function loadDbFromDisk(): any {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed.last_modified_timestamp) {
        lastModifiedTimestamp = parsed.last_modified_timestamp;
      }
      return parsed;
    }
  } catch (err) {
    console.error("Failed to read clinic_state.json from disk:", err);
  }
  return null;
}

function saveDbToDisk(data: any, sourceDeviceId?: string) {
  try {
    lastModifiedTimestamp = Date.now();
    data.last_modified_timestamp = lastModifiedTimestamp;
    serverDbCache = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");

    // Broadcast update to all connected clients immediately
    broadcastSync("SYNC_ALL", data, sourceDeviceId);
    return true;
  } catch (err) {
    console.error("Failed to write clinic_state.json to disk:", err);
    return false;
  }
}

function broadcastSync(type: string, data: any, sourceDeviceId?: string) {
  const payload = JSON.stringify({
    type,
    data,
    timestamp: lastModifiedTimestamp,
    sourceDeviceId: sourceDeviceId || "server",
  });

  const deadClients: express.Response[] = [];
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      deadClients.push(client);
    }
  }
  if (deadClients.length > 0) {
    sseClients = sseClients.filter((c) => !deadClients.includes(c));
  }
}

// Initialize cache from disk
serverDbCache = loadDbFromDisk();

async function startServer() {
  const app = express();

  // Allow larger payload for image uploads and full database sync
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Serve uploaded images statically across all devices
  app.use("/uploads", express.static(UPLOADS_DIR));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: Date.now(),
      lastModifiedTimestamp,
      hasCache: !!serverDbCache,
      connectedClients: sseClients.length,
    });
  });

  // Server-Sent Events (SSE) for Real-Time Multi-Device Push
  app.get("/api/clinic-db/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders?.();

    sseClients.push(res);

    // Send immediate initial sync snapshot
    if (serverDbCache) {
      res.write(
        `data: ${JSON.stringify({
          type: "INITIAL_SYNC",
          data: serverDbCache,
          timestamp: lastModifiedTimestamp,
        })}\n\n`
      );
    }

    // Keep-alive heartbeat every 20 seconds
    const heartbeat = setInterval(() => {
      try {
        res.write(": heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 20000);

    req.on("close", () => {
      clearInterval(heartbeat);
      sseClients = sseClients.filter((c) => c !== res);
    });
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

  // Update shared database state (from manager, developer, or reception)
  app.post("/api/clinic-db", (req, res) => {
    const { db, sourceDeviceId } = req.body;
    if (!db) {
      return res.status(400).json({ success: false, error: "Missing db payload" });
    }
    const saved = saveDbToDisk(db, sourceDeviceId);
    if (saved) {
      res.json({
        success: true,
        timestamp: lastModifiedTimestamp,
        data: serverDbCache,
      });
    } else {
      res.status(500).json({ success: false, error: "Failed to persist database" });
    }
  });

  // Specific Endpoint: Update Site Configuration (Developer Desk)
  app.post("/api/update-site-config", (req, res) => {
    const { site_config, sourceDeviceId } = req.body;
    if (!site_config) {
      return res.status(400).json({ success: false, error: "Missing site_config payload" });
    }

    if (!serverDbCache) {
      serverDbCache = loadDbFromDisk() || {};
    }

    serverDbCache.site_config = {
      ...(serverDbCache.site_config || {}),
      ...site_config,
      updated_at: new Date().toISOString(),
    };

    const saved = saveDbToDisk(serverDbCache, sourceDeviceId);
    if (saved) {
      res.json({
        success: true,
        site_config: serverDbCache.site_config,
        timestamp: lastModifiedTimestamp,
        data: serverDbCache,
      });
    } else {
      res.status(500).json({ success: false, error: "Failed to persist site configuration" });
    }
  });

  // Specific Endpoint: Manage Clinic Gallery Pictures (Manager / Developer Desk)
  app.post("/api/gallery", (req, res) => {
    const { action, item, id, sourceDeviceId } = req.body;
    if (!serverDbCache) {
      serverDbCache = loadDbFromDisk() || {};
    }
    if (!serverDbCache.gallery) {
      serverDbCache.gallery = [];
    }

    if (action === "add" && item) {
      const newItem = {
        ...item,
        id: item.id || `pic-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        created_at: item.created_at || new Date().toISOString(),
      };
      serverDbCache.gallery = [newItem, ...serverDbCache.gallery];
    } else if (action === "update" && id && item) {
      serverDbCache.gallery = serverDbCache.gallery.map((g: any) =>
        g.id === id ? { ...g, ...item } : g
      );
    } else if (action === "delete" && id) {
      serverDbCache.gallery = serverDbCache.gallery.filter((g: any) => g.id !== id);
    }

    const saved = saveDbToDisk(serverDbCache, sourceDeviceId);
    if (saved) {
      res.json({
        success: true,
        gallery: serverDbCache.gallery,
        timestamp: lastModifiedTimestamp,
        data: serverDbCache,
      });
    } else {
      res.status(500).json({ success: false, error: "Failed to update gallery" });
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
      // If dataUrl matches data:image/..., save binary file to public/uploads
      const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
        const base64Data = matches[2];
        const safeName = (filename || "clinic_pic")
          .replace(/[^a-zA-Z0-9_-]/g, "_")
          .slice(0, 40);
        const diskName = `${Date.now()}_${safeName}.${ext}`;
        const filePath = path.join(UPLOADS_DIR, diskName);
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
