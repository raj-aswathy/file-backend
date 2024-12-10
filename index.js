const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("uploads"));

const ensureDirExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDirExists("./uploads/mobile");
ensureDirExists("./uploads/desktop");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads"); 
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); 
  },
});

const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
    return callback(new Error("Only PNG, JPEG, JPG files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
});

app.post("/upload", upload.array("files", 10), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: "No files uploaded!" });
  }

  try {
    const resizedFiles = await Promise.all(
      req.files.map(async (file) => {
        const originalFilePath = `./uploads/${file.filename}`;
        const mobileFilePath = `./uploads/mobile/${file.filename}`;
        const desktopFilePath = `./uploads/desktop/${file.filename}`;

        await sharp(originalFilePath)
          .extract({ left: 0, top: 0, width: 600, height: 600 }) 
          .resize(480) 
          .toFile(mobileFilePath);

        await sharp(originalFilePath)
          .extract({ left: 0, top: 0, width: 600, height: 600 }) 
          .resize(1920) 
          .toFile(desktopFilePath);

        return {
          original: `/uploads/${file.filename}`,
          mobile: `/uploads/mobile/${file.filename}`,
          desktop: `/uploads/desktop/${file.filename}`,
        };
      })
    );

    res.status(200).json({
      message: "Files uploaded and resized successfully!",
      files: resizedFiles,
    });
  } catch (err) {
    console.error("Error resizing images:", err);
    res
      .status(500)
      .json({ message: "Error resizing images", error: err.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
