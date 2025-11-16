const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const path = require("path");
const Opportunity = require("../models/Opportunity");

const router = express.Router();

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: cloudinary uploader with stream
const streamUpload = (fileBuffer, originalName) => {
  return new Promise((resolve, reject) => {
    const fileExtension = path.extname(originalName);
    const fileName = path.basename(originalName, fileExtension); // Get the file name without extension

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "opportunities",
        public_id: `${fileName}${fileExtension}`, // Set the public ID with the file extension
      },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(fileBuffer);
  });
};

// POST /opportunities
router.post("/", upload.single("document"), async (req, res) => {
  try {
    let documentUrl = "";

    if (req.file) {
      const result = await streamUpload(req.file.buffer, req.file.originalname);
      documentUrl = result.secure_url;
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
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to create opportunity" });
  }
});

// GET /opportunities
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
    console.error(error);
    res.status(500).json({ error: "Failed to fetch opportunities" });
  }
});

// GET /opportunities/:id - Get single opportunity
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const opportunity = await Opportunity.findById(id);

    if (!opportunity) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    res.json(opportunity);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch opportunity" });
  }
});

// PUT /opportunities/:id
router.put("/:id", upload.single("document"), async (req, res) => {
  try {
    let documentUrl = req.body.existingDocumentUrl || "";

    if (req.file) {
      const result = await streamUpload(req.file.buffer, req.file.originalname);
      documentUrl = result.secure_url;
    }

    const updated = await Opportunity.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        documentUrl,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    res.json(updated);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update opportunity" });
  }
});

// DELETE /opportunities/:id
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Opportunity.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Opportunity not found" });
    }

    res.json({ message: "Opportunity deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete opportunity" });
  }
});

module.exports = router;
