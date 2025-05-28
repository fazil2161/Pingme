const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
const profilePicsDir = path.join(uploadsDir, 'profile-pics');
const postImagesDir = path.join(uploadsDir, 'post-images');

// Create directories if they don't exist
[uploadsDir, profilePicsDir, postImagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadPath = uploadsDir;
    
    // Determine upload directory based on field name
    if (file.fieldname === 'profilePicture') {
      uploadPath = profilePicsDir;
    } else if (file.fieldname === 'postImage') {
      uploadPath = postImagesDir;
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const fileName = file.fieldname + '-' + uniqueSuffix + fileExtension;
    cb(null, fileName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    // Allowed image types
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
    }
  } else {
    cb(new Error('Only image files are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 1 // Maximum 1 file per request
  }
});

// Memory storage for processing images before saving
const memoryStorage = multer.memoryStorage();

const uploadToMemory = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
    files: 1
  }
});

// Helper function to delete uploaded files
const deleteFile = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        console.error('Error deleting file:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Helper function to get file URL
const getFileUrl = (filename, type = 'post-images') => {
  if (!filename) return null;
  
  const baseUrl = process.env.SERVER_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Middleware to handle single file upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.single(fieldName);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 15MB.'
          });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Only one file is allowed.'
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
          });
        }
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

// Middleware to handle multiple files upload
const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    const uploadMiddleware = upload.array(fieldName, maxCount);
    
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size is 15MB per file.'
          });
        } else if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: `Too many files. Maximum ${maxCount} files allowed.`
          });
        } else {
          return res.status(400).json({
            success: false,
            message: 'File upload error: ' + err.message
          });
        }
      } else if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      
      next();
    });
  };
};

// Middleware to validate image dimensions (optional)
const validateImageDimensions = (minWidth = 0, minHeight = 0, maxWidth = 2000, maxHeight = 2000) => {
  return (req, res, next) => {
    if (!req.file) {
      return next();
    }
    
    const sharp = require('sharp');
    
    sharp(req.file.path)
      .metadata()
      .then(metadata => {
        const { width, height } = metadata;
        
        if (width < minWidth || height < minHeight) {
          // Delete the uploaded file
          deleteFile(req.file.path);
          return res.status(400).json({
            success: false,
            message: `Image dimensions too small. Minimum ${minWidth}x${minHeight} required.`
          });
        }
        
        if (width > maxWidth || height > maxHeight) {
          // Delete the uploaded file
          deleteFile(req.file.path);
          return res.status(400).json({
            success: false,
            message: `Image dimensions too large. Maximum ${maxWidth}x${maxHeight} allowed.`
          });
        }
        
        // Add dimensions to request object
        req.file.dimensions = { width, height };
        next();
      })
      .catch(err => {
        console.error('Error validating image dimensions:', err);
        deleteFile(req.file.path);
        res.status(400).json({
          success: false,
          message: 'Invalid image file.'
        });
      });
  };
};

// Helper function to process and resize images
const processImage = async (inputPath, outputPath, options = {}) => {
  const sharp = require('sharp');
  
  const {
    width = null,
    height = null,
    quality = 85,
    format = 'jpeg'
  } = options;
  
  let pipeline = sharp(inputPath);
  
  // Resize if dimensions specified
  if (width || height) {
    pipeline = pipeline.resize(width, height, {
      fit: 'cover',
      position: 'center'
    });
  }
  
  // Set format and quality
  if (format === 'jpeg') {
    pipeline = pipeline.jpeg({ quality });
  } else if (format === 'png') {
    pipeline = pipeline.png({ quality });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  }
  
  await pipeline.toFile(outputPath);
};

// Cleanup old uploaded files (for maintenance)
const cleanupOldFiles = (directory, maxAge = 24 * 60 * 60 * 1000) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        return reject(err);
      }
      
      const now = Date.now();
      let deletedCount = 0;
      
      files.forEach(file => {
        const filePath = path.join(directory, file);
        
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          const fileAge = now - stats.mtime.getTime();
          
          if (fileAge > maxAge) {
            fs.unlink(filePath, (err) => {
              if (!err) {
                deletedCount++;
              }
            });
          }
        });
      });
      
      setTimeout(() => {
        resolve(deletedCount);
      }, 1000);
    });
  });
};

module.exports = {
  upload,
  uploadToMemory,
  uploadSingle,
  uploadMultiple,
  validateImageDimensions,
  processImage,
  deleteFile,
  getFileUrl,
  cleanupOldFiles
}; 