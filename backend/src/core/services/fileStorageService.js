const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const logger = require('../infrastructure/logger');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.png', '.jpg', '.jpeg', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Недопустимый формат файла')); 
    }
    cb(null, true);
  },
}).single('file');

const uploadFileToS3 = async (fileBuffer, fileName, folder = 'uploads') => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: `${folder}/${Date.now()}_${fileName}`,
      Body: fileBuffer,
      ContentType: 'application/octet-stream',
      ACL: 'private',
    };
    const uploadResult = await s3.upload(params).promise();
    logger.info(`✅ Файл загружен: ${uploadResult.Location}`);
    return uploadResult.Location;
  } catch (error) {
    logger.error(`❌ Ошибка загрузки файла: ${error.message}`);
    throw error;
  }
};

module.exports = { upload, uploadFileToS3 };
