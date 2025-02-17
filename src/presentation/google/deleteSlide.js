const { google } = require("googleapis");

async function deleteSlide(auth, presentationId, slideObjectId) {
  try {
    const slides = google.slides({ version: 'v1', auth });
    
    // Create a batchUpdate request to delete the slide
    const requests = [
      {
        deleteObject: {
          objectId: slideObjectId,
        },
      },
    ];
    
    await slides.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
    
    console.log(`Slide with ID '${slideObjectId}' deleted successfully from presentation '${presentationId}'.`);
    return { success: true, message: `Deleted slide with ID: ${slideObjectId}` };
  } catch (error) {
    console.error('Error deleting slide:', error);
    throw error;
  }
}

module.exports = deleteSlide;