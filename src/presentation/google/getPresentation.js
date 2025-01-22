const { google } = require("googleapis");

/**
 * Returns an array of slides. Each slide in the array has:
 *   {
 *     slideNumber: number,
 *     pageObjectId: string,
 *     shapes: [
 *       {
 *         shapeId: string,
 *         type: "text" | "table" | "image" | "group" | etc.,
 *         text: string,          // Plaintext extracted from runs (if text shape)
 *         paragraphs: [...],    // Detailed paragraphs/runs for text shapes
 *         tableCells: [         // For tables: an array of cell objects
 *           {
 *             rowIndex: number,
 *             columnIndex: number,
 *             paragraphs: [...],
 *             text: string,
 *           },
 *           ...
 *         ],
 *         imageUrl: string,     // If it's an image shape
 *         ...
 *       },
 *       ...
 *     ]
 *   }
 *
 * If `pageObjectId` is provided, only return that single slide (or empty if not found).
 *
 * @param {object} auth - Authenticated google.auth.JWT or OAuth2 client.
 * @param {string} presentationId - The ID of the Google Slides presentation.
 * @param {string|null} pageObjectId - If set, only return the slide with this ID. Otherwise return all slides.
 * @returns {Promise<Array>} Array of slide objects (possibly length 1 if pageObjectId was given).
 */
async function getPresentation(auth, presentationId, pageObjectId = null) {
  const slidesService = google.slides({ version: "v1", auth });
  let presentation;
  try {
    presentation = await slidesService.presentations.get({ presentationId });
  } catch (error) {
    console.error("Error retrieving presentation:", error);
    throw error;
  }
  return presentation;
}


module.exports = getPresentation;