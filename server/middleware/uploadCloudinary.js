const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

// Storage for voter face photos
const voterFaceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'evoteface/voter_faces',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [
      { width: 800, height: 800, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// Storage for party symbols
const partySymbolStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'evoteface/party_symbols',
    allowed_formats: ['jpg', 'jpeg', 'png', 'svg'],
    transformation: [
      { width: 400, height: 400, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// File filter to validate image types
const imageFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Multer upload middleware for voter faces
const uploadVoterFace = multer({
  storage: voterFaceStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

// Multer upload middleware for party symbols
const uploadPartySymbol = multer({
  storage: partySymbolStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  }
});

module.exports = {
  uploadVoterFace,
  uploadPartySymbol
};
