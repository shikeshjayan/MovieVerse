import { v2 as cloudinary } from 'cloudinary';

let isConfigured = false;

const configureCloudinary = () => {
  if (isConfigured) return;
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    isConfigured = true;
  }
};

export const uploadToCloudinary = async (base64Image, options = {}) => {
  configureCloudinary();
  return cloudinary.uploader.upload(base64Image, options);
};

export default cloudinary;
