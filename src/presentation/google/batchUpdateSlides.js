const { google } = require("googleapis");
const { reapplyFormatting } = require("../../utils");


/**
 * batchUpdateSlidesText
 *
 * Applies each shape's updated text + formatting from an "updatedMap"
 * (such as your `originalSegmentMapUpdated`) to the live Google Slides.
 * 
 * - No shape existence verification (we assume shape IDs are valid).
 * - We do *not* re-derive paragraphs by splitting on `\n`; we rely on
 *   the shapeData's existing paragraphs->runs to reapply formatting.
 *
 * @param {object} auth - Auth client for Google APIs
 * @param {string} presentationId - The ID of the Slides presentation
 * @param {object} updatedMap - The updated segment map 
 *   (type="text"/"table") containing paragraphs->runs (with final text + style)
 * @returns {boolean} True if updates were made; false otherwise
 */
async function batchUpdateSlidesText(auth, presentationId, updatedMap) {
    console.log("Starting batch update without shape existence verification...");
  
    const slidesService = google.slides({ version: "v1", auth });
    const requests = [];
    let madeAnyUpdates = false;
  
    for (const shapeId in updatedMap) {
      const shapeData = updatedMap[shapeId];
      console.log("shapeData", shapeData);
      if (!shapeData) continue; // skip if shapeData is null or undefined
  
      // 1) Handle TEXT shape
      if (shapeData.type === "text" && Array.isArray(shapeData.paragraphs)) {
        // (A) Build a single newText with exact paragraph boundaries
        let newText = "";
        // Also collect updatedRuns for the reapply step
        let updatedRuns = [];
  
        for (const paragraph of shapeData.paragraphs) {
          // Flatten runs in this paragraph
          const paragraphText = paragraph.runs.map((r) => r.text).join("");
          // Add them to newText
          newText += paragraphText;
  
          // Add each run to updatedRuns
          paragraph.runs.forEach((run) => updatedRuns.push(run));
        }
  
        // (B) Delete existing text
        requests.push({
          deleteText: {
            objectId: shapeId,
            textRange: { type: "ALL" },
          },
        });
  
        // (C) Insert the entire text at once
        if (newText.length > 0) {
          requests.push({
            insertText: {
              objectId: shapeId,
              insertionIndex: 0,
              text: newText,
            },
          });
        };
  
        // (D) Reapply formatting to match original runs/paragraphs
        // We pass updatedRuns to both updatedRuns/originalRuns
        reapplyFormatting(
          requests,
          shapeId,
          updatedRuns,     // Flattened runs
          updatedRuns,     // If same style data
          shapeData.paragraphs,
          false,           // isTable?
          null             // cellLocation
        );
  
        madeAnyUpdates = true;
      }
  
      // 2) Handle TABLE shape
      else if (shapeData.type === "table" && shapeData.cells) {
        // For each cell, flatten its runs & insert
        for (const cellKey in shapeData.cells) {
          const cellData = shapeData.cells[cellKey];
          if (!cellData || !Array.isArray(cellData.paragraphs)) {
            console.log(`[${shapeId}] - Cell [${cellKey}] lacks paragraphs; skipping...`);
            continue;
          }
  
          // Parse row & column from "rowIndex-colIndex"
          const [rowIndexStr, colIndexStr] = cellKey.split("-");
          const rowIndex = parseInt(rowIndexStr, 10);
          const columnIndex = parseInt(colIndexStr, 10);
  
          // Flatten runs in paragraphs
          const updatedRuns = [];
          cellData.paragraphs.forEach((p) => p.runs.forEach((r) => updatedRuns.push(r)));
          const newText = updatedRuns.map((r) => r.text || "").join("");
  
          console.log(`\n--- [${shapeId}] - TABLE CELL [${cellKey}] ---`);
          console.log(`[${shapeId}] Flattened runs => newText:\n"${newText}"`);
  
          // (A) Delete existing text in that cell
          requests.push({
            deleteText: {
              objectId: shapeId,
              cellLocation: { rowIndex, columnIndex },
              textRange: { type: "ALL" },
            },
          });
  
          // (B) Insert the new text
          if (newText.length > 0) {
            requests.push({
              insertText: {
                objectId: shapeId,
                cellLocation: { rowIndex, columnIndex },
                insertionIndex: 0,
                text: newText,
              },
            });
          };
  
          // (C) Reapply formatting
          reapplyFormatting(
            requests,
            shapeId,
            updatedRuns,
            updatedRuns,  // If you carried the style forward in updatedRuns
            cellData.paragraphs,
            true,         // isTable
            { rowIndex, columnIndex }
          );
        }
  
        madeAnyUpdates = true;
      }
    }
  
    if (!madeAnyUpdates || requests.length === 0) {
      console.log("No updates to perform. Exiting...");
      return false;
    }
  
    // 3) Execute the batchUpdate requests
    await slidesService.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });
    console.log("Batch update successful (no verification).");
    return true;
}

module.exports = batchUpdateSlidesText;