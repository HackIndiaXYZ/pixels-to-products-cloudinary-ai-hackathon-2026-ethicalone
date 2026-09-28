const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function getFullAssetDetails(publicId) {
  try {
    const result = await cloudinary.api.resource(publicId, {
      colors: true,
      image_metadata: true,
      moderation: true
    });
    return result;
  } catch (error) {
    console.error(`Failed to fetch Cloudinary details for ${publicId}:`, error.message);
    throw error;
  }
}

module.exports = { getFullAssetDetails };