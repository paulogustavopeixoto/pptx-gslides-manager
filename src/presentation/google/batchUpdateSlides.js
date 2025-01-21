const { google } = require("googleapis");
const { reapplyFormatting } = require("../../utils");

/**
 * batchUpdateSlidesText (Array-based)
 *
 * Takes an array of slides => each with .shapes => each shape has updated text
 * or tableCells. Generates a set of Google Slides API requests to
 * delete/insert text, then re-apply each run’s formatting.
 *
 * @param {object} auth - Auth client for Google APIs
 * @param {string} presentationId - The ID of the Slides presentation
 * @param {Array} slidesArray - The updated data in array form, e.g.:
 *   [
 *     {
 *       slideNumber: 5,
 *       pageObjectId: "p5",
 *       shapes: [
 *         {
 *           shapeId: "p5_i5",
 *           type: "text",
 *           paragraphs: [...],
 *         },
 *         {
 *           shapeId: "p5_i15",
 *           type: "table",
 *           tableCells: [ ... ],
 *         },
 *         ...
 *       ]
 *     }
 *   ]
 * @returns {boolean} True if updates were performed, false otherwise
 */
async function batchUpdateSlidesText(auth, presentationId, slidesArray) {
  console.log("Starting batch update (array-based)...");
  const slidesService = google.slides({ version: "v1", auth });

  const requests = [];
  let madeAnyUpdates = false;

  // 1) Loop over each slide
  for (const slide of slidesArray) {
    // 2) Loop over each shape in that slide
    for (const shape of slide.shapes) {
      const shapeId = shape.shapeId;
      if (!shapeId) continue; // skip if no shapeId

      // --- TEXT SHAPE ---
      if (shape.type === "text" && Array.isArray(shape.paragraphs)) {
        // A) Build the new text by flattening paragraphs/runs
        let newText = "";
        const updatedRuns = [];
        for (const paragraph of shape.paragraphs) {
          for (const run of paragraph.runs) {
            updatedRuns.push(run);
            newText += run.text || "";
          }
        }

        // B) Check if the shape is currently empty or not
        //    If the shape has paragraphs/runs at all, let's see if there's any text
        //    "existingTextLength" is how many chars are in the updated shape’s paragraphs
        //    If you want to be extremely accurate about what's actually in Google,
        //    you'd look up the original text from the original shape data. But typically
        //    the new structure matches the original text length if you haven't changed it.
        const existingTextLength = newText.length;

        // If there's *some* text in the shape, we do a delete
        // But if we see *zero* text, skip the delete to avoid "startIndex 0 must be < endIndex 0"
        if (existingTextLength > 0) {
          requests.push({
            deleteText: {
              objectId: shapeId,
              textRange: { type: "ALL" },
            },
          });
        }

        if (existingTextLength > 0) {
          requests.push({
            insertText: {
              objectId: shapeId,
              insertionIndex: 0,
              text: newText,
            },
          });
        }

        // C) Re-apply formatting for each run
        reapplyFormatting(
          requests,
          shapeId,
          updatedRuns,       // updatedRuns
          updatedRuns,       // originalRuns or same if you haven't changed style
          shape.paragraphs,  // array of paragraphs
          false,             // isTable = false
          null               // cellLocation = null
        );

        madeAnyUpdates = true;
      }

      // --- TABLE SHAPE ---
      else if (shape.type === "table" && Array.isArray(shape.tableCells)) {
        // shape.tableCells = [
        //   { rowIndex, columnIndex, paragraphs: [...], runs: [...] },
        //   ...
        // ]

        for (const cell of shape.tableCells) {
          const { rowIndex, columnIndex, paragraphs } = cell;
          if (!paragraphs) continue;

          // Flatten runs
          const updatedRuns = [];
          let newText = "";
          paragraphs.forEach((p) => {
            p.runs.forEach((r) => {
              updatedRuns.push(r);
              newText += r.text || "";
            });
          });

          console.log(`\n[${shapeId}] TABLE cell(${rowIndex},${columnIndex}) => newText:\n"${newText}"`);

          // A) Delete existing text in that cell
          requests.push({
            deleteText: {
              objectId: shapeId,
              cellLocation: { rowIndex, columnIndex },
              textRange: { type: "ALL" },
            },
          });

          // B) Insert the new text (if any)
          if (newText.length > 0) {
            requests.push({
              insertText: {
                objectId: shapeId,
                cellLocation: { rowIndex, columnIndex },
                insertionIndex: 0,
                text: newText,
              },
            });
          }

          // C) Reapply formatting
          reapplyFormatting(
            requests,
            shapeId,
            updatedRuns,
            updatedRuns,        // or separate originalRuns if you have them
            paragraphs,         // the cell's paragraphs
            true,               // isTable = true
            { rowIndex, columnIndex }
          );

          madeAnyUpdates = true;
        }
      }
    } // end shape loop
  } // end slide loop

  // 3) If there are no updates, skip the API call
  if (!madeAnyUpdates || requests.length === 0) {
    console.log("No updates to perform. Exiting...");
    return false;
  }

  // 4) Execute the batchUpdate requests
  await slidesService.presentations.batchUpdate({
    presentationId,
    requestBody: { requests },
  });

  console.log("Batch update successful (array-based).");
  return true;
}

module.exports = batchUpdateSlidesText;