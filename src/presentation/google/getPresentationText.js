// src/googleSlides/getPresentationText.js
const getPresentation = require("./getPresentation");
const getSlides = require("./slidesExtraction");

/**
 * Retrieves slide data (via getSlides) and assembles one large text string
 * that contains all the text from every shape in every slide (or just one slide
 * if pageObjectId is given).
 *
 * @param {object} auth - Authenticated google.auth.JWT or OAuth2 client.
 * @param {string} presentationId - The Google Slides presentation ID.
 * @param {string|null} pageObjectId - If specified, only retrieve that slide;
 *                                     otherwise retrieve all slides.
 * @returns {Promise<string>} A single, joined string of all text in slide order.
 */
async function getPresentationText(auth, presentationId, pageObjectId = null) {
  // 1) Fetch the entire presentation (all slides) in one API call
  //    getPresentation(...) should call the Slides API and return the presentation object
  const presentationResult = await getPresentation(auth, presentationId);

  // 2) Extract the array of slides from the returned data
  const allSlides = presentationResult.data.slides || [];

  // 3) If pageObjectId is given, filter down to that slide; otherwise keep them all
  let targetSlides = allSlides;
  if (pageObjectId) {
    targetSlides = allSlides.filter(
      (slide) => slide.objectId === pageObjectId
    );
  }

  // We'll store text from each slide in this array
  const textChunks = [];

  // 4) Loop through each relevant slide
  for (const slide of targetSlides) {
    const slideId = slide.objectId;

    // 4a) Use your single-slide function (getSlides) to get shape/text data
    //     NOTE: The updated getSlides(...) typically takes:
    //           getSlides(presentationResult, slideId)
    //     because it no longer calls the Google API; it just processes the local JSON
    const shapeMap = await getSlides(presentationResult, slideId);

    // 4b) Build a text string for this slide
    let slideText = "";

    // shapeMap is an object keyed by shapeId, with shapeData containing type, paragraphs, etc.
    for (const [shapeId, shapeData] of Object.entries(shapeMap)) {
      // If it's a text shape
      if (shapeData.type === "text" && Array.isArray(shapeData.paragraphs)) {
        // Combine all runs in all paragraphs
        const textFromRuns = shapeData.paragraphs
          .map((p) => p.runs.map((r) => r.text).join(" "))
          .join("\n");
        slideText += textFromRuns + "\n";
      }
      // If it's a table
      else if (shapeData.type === "table" && shapeData.cells) {
        // shapeData.cells might be an object keyed by row-col like "0-0"
        for (const cellKey of Object.keys(shapeData.cells)) {
          const cellObj = shapeData.cells[cellKey];
          if (cellObj.paragraphs) {
            const cellText = cellObj.paragraphs
              .map((p) => p.runs.map((r) => r.text).join(" "))
              .join(" ");
            slideText += cellText + " ";
          }
        }
        slideText += "\n";
      }
      // If it's an image or something else, skip or handle differently
    }

    // Trim and store the combined text for this slide
    textChunks.push(slideText.trim());
  }

  // 5) Join all slide texts with double newlines (or single, whichever you prefer)
  return textChunks.join("\n\n");
}

module.exports = getPresentationText;