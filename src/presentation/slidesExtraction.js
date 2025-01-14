const { google } = require("googleapis");
const { processElement } = require("../utils");


const getSlides = {
    google: async function (auth, presentationId) {
        try {
            const slidesService = google.slides({ version: 'v1', auth });
            const presentationData = await slidesService.presentations.get({ presentationId });
            const slidesData = presentationData.data.slides;
            const slidesWithText = [];
        
            // Process each slide
            slidesData.forEach((slide, index) => {
              const slideNumber = index + 1;
              const shapesWithText = [];
              let shapeOrder = { order: 1 }; // Use object to allow modification in recursive calls
        
              slide.pageElements.forEach((element) => {
                processElement(element, shapesWithText, shapeOrder);
              });
        
              slidesWithText.push({
                slideNumber,
                shapes: shapesWithText, // Store shapes including text boxes and tables
                pageObjectId: slide.objectId,
              });
            });
        
            return slidesWithText;
        
          } catch (error) {
            console.error('Error retrieving slides with text shapes:', error);
            throw error;
          }
    }
}

module.exports = getSlides;