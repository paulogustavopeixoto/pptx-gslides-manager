// src/googleSlides/getPresentationText.js
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
  // 1) Fetch slides using your existing getSlides function
  const slidesWithText = await getSlides(auth, presentationId, pageObjectId);

  // 2) Build one big string from the slides array
  const bigFinalText = slidesWithText
    // Ensure we process slides in ascending order by slideNumber
    .sort((a, b) => a.slideNumber - b.slideNumber)
    .map((slide) => {
      // For each slide, gather text from shapes
      return slide.shapes
        .map((shape) => {
          if (shape.type === "text") {
            // Simple text shape
            return shape.text || "";
          } else if (shape.type === "table") {
            // For a table, join all cell text from all rows/columns
            return shape.tableCells
              .map((cell) => cell.text || "")
              .join(" ");
          }
          // If it's an image or something else, we skip or return empty
          return "";
        })
        // Join shapes with a space or newline
        .join(" ");
    })
    // Finally, join slides with e.g. two newlines (or a single newline)
    .join("\n\n");

  return bigFinalText;
}

module.exports = getPresentationText;