import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import {
  getUserFinancialItems,
  saveFinancialItem,
  deleteFinancialItem,
  bulkSyncFinancialItems,
} from "./src/db/financialItems.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", database: "Cloud SQL PostgreSQL" });
  });

  // Get user's financial items from Cloud SQL
  app.get("/api/items", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "user@example.com";
      const name = req.user?.name || null;

      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await getOrCreateUser(uid, email, name);
      const items = await getUserFinancialItems(uid);
      res.json({ items });
    } catch (error: any) {
      console.error("Error fetching items from Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to fetch items" });
    }
  });

  // Save/Update single financial item in Cloud SQL
  app.post("/api/items", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "user@example.com";
      const name = req.user?.name || null;

      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const item = req.body;
      if (!item || !item.id || !item.title) {
        return res.status(400).json({ error: "Invalid item payload" });
      }

      await getOrCreateUser(uid, email, name);
      const savedItem = await saveFinancialItem(item, uid);
      res.json({ item: savedItem });
    } catch (error: any) {
      console.error("Error saving item to Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to save item" });
    }
  });

  // Delete financial item from Cloud SQL
  app.delete("/api/items/:id", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { id } = req.params;
      await deleteFinancialItem(id, uid);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error("Error deleting item from Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to delete item" });
    }
  });

  // Bulk sync local financial items to Cloud SQL
  app.post("/api/items/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user?.uid;
      const email = req.user?.email || "user@example.com";
      const name = req.user?.name || null;

      if (!uid) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { items } = req.body;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "Expected items array" });
      }

      await getOrCreateUser(uid, email, name);
      const syncedItems = await bulkSyncFinancialItems(items, uid);
      res.json({ items: syncedItems });
    } catch (error: any) {
      console.error("Error syncing items to Cloud SQL:", error);
      res.status(500).json({ error: error.message || "Failed to sync items" });
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
