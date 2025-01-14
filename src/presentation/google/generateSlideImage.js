const { google } = require("googleapis");
const axios = require("axios");


async function generateSlideImage(auth, presentationId, pageObjectId, maxRetries = 3) {

  console.log(`Generating Base64 image for pageObjectId ${pageObjectId}...`);
  const slidesService = google.slides({ version: "v1", auth });
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      attempt++;
      console.log(`Attempt ${attempt} to fetch thumbnail...`);
      const thumbnailResponse = await slidesService.presentations.pages.getThumbnail({
        presentationId,
        pageObjectId,
      });
      const contentUrl = thumbnailResponse.data.contentUrl;
      console.log(`Thumbnail URL retrieved: ${contentUrl}`);

      const imageResponse = await axios.get(contentUrl, { responseType: "arraybuffer" });
      const base64Image = Buffer.from(imageResponse.data, "binary").toString("base64");
      console.log("Base64 image generated successfully.");
      return `data:image/png;base64,${base64Image}`;
    } catch (error) {
      console.error(`Error generating Base64 image on attempt ${attempt}:`, error);
      if (attempt === maxRetries) {
        console.warn("Max retries reached for image generation. Returning null.");
        return null;
      }
    }
  }
}

module.exports = generateSlideImage;