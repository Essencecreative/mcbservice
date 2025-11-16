const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const Opportunity = require("../models/Opportunity");

const router = express.Router();

/* -------------------------------
   Multer storage for PDF/doc uploads
--------------------------------*/
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadPath = path.join(__dirname, "..", "uploads", "opportunities");
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* -------------------------------
   Helper: build public file URL
--------------------------------*/
const buildFileUrl = (req, filename) => {
  return `${req.protocol}://${req.get("host")}/uploads/opportunities/${filename}`;
};

/* -------------------------------
   POST /opportunities - Create
--------------------------------*/
router.post("/", upload.single("document"), async (req, res) => {
  try {
    let documentUrl = "";

    if (req.file) {
      documentUrl = buildFileUrl(req, req.file.filename);
    }

    const opportunity = new Opportunity({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      documentUrl,
    });

    const saved = await opportunity.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Create error:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

/* -------------------------------
   GET /opportunities - List
--------------------------------*/
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    const query = {};
    if (category && category.toLowerCase() !== "all") {
      query.category = category;
    }

    const opportunities = await Opportunity.find(query).sort({ createdAt: -1 });
    res.json(opportunities);
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

/* -------------------------------
   GET /opportunities/:id - Single
--------------------------------*/
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await Opportunity.findById(id);

    if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });

    res.json(opportunity);
  } catch (error) {
    console.error("Fetch single error:", error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

/* -------------------------------
   PUT /opportunities/:id - Update
--------------------------------*/
router.put("/:id", upload.single("document"), async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });

    let documentUrl = req.body.existingDocumentUrl || opportunity.documentUrl;

    if (req.file) {
      // Delete old file if it exists
      if (opportunity.documentUrl) {
        const oldPath = path.join(
          __dirname,
          "..",
          opportunity.documentUrl.replace(`${req.protocol}://${req.get("host")}/`, "")
        );
        await fs.unlink(oldPath).catch(() => {});
      }

      documentUrl = buildFileUrl(req, req.file.filename);
    }

    opportunity.title = req.body.title;
    opportunity.description = req.body.description;
    opportunity.category = req.body.category;
    opportunity.documentUrl = documentUrl;

    const updated = await opportunity.save();
    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

/* -------------------------------
   DELETE /opportunities/:id
--------------------------------*/
router.delete("/:id", async (req, res) => {
  try {
    const opportunity = await Opportunity.findById(req.params.id);
    if (!opportunity) return res.status(404).json({ error: "Opportunity not found" });

    // Delete file if exists
    if (opportunity.documentUrl) {
      const oldPath = path.join(
        __dirname,
        "..",
        opportunity.documentUrl.replace(`${req.protocol}://${req.get("host")}/`, "")
      );
      await fs.unlink(oldPath).catch(() => {});
    }

    await Opportunity.findByIdAndDelete(req.params.id);
    res.json({ message: "Opportunity deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
});

module.exports = router;
