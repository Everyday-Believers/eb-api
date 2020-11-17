const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('../config');
const s3 = new AWS.S3({
  accessKeyId: config.AWS_ACCESS_KEY_ID,
  secretAccessKey: config.AWS_SECRET_ACCESS_KEY
});

/**
 * Upload image to S3 bucket
 */
exports.uploadImage = async (filepath, filename) => {
  try {
    const fileContent = fs.readFileSync(filepath + filename);
    const uploadFileName = filename;
    // Setting up S3 upload parameters
    const params = {
        Bucket: config.AWS_STORAGE_BUCKET_NAME,
        Key:  uploadFileName, // File name you want to save as in S3
        Body: fileContent,
        ACL: 'public-read'
    };

    const stored = await s3.upload(params).promise();

    fs.unlinkSync(filepath + filename);

    return { file: stored.Location, file_name: stored.Key }
  } catch (error) {
    return { error }
  }
} 
