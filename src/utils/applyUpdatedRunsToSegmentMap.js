const preserveParagraphBoundaries = require('./preserveParagraphBoundaries');
const recalcParagraphAndRunIndices = require('./recalcParagraphAndRunIndices');


/**
 * applyUpdatedRunsToSegmentMap
 *
 * Merges the new text from “second prompt” updatedRuns into the originalSegmentMap,
 * matching by run IDs. Then **recalculates** paragraph/runs startIndex/endIndex
 * so they match the new text length.
 *
 * @param {Object} originalSegmentMap - The map built from extractParagraphsAndRuns
 * @param {Array} updatedShapes - The array from secondPrompt’s “content”
 * @returns {Object} A modified copy of originalSegmentMap with updated text + corrected indices
 */
function applyUpdatedRunsToSegmentMap(originalSegmentMap, updatedShapes) {
  // 1) Clone original (or mutate in place, if you prefer)
  const segmentMapCopy = JSON.parse(JSON.stringify(originalSegmentMap));

  // 2) For each shapeId in updatedShapes
  for (const shapeId in updatedShapes) {
    let updatedShape = updatedShapes[shapeId];

    // We'll loop over *slides* in segmentMapCopy
    for (let slideIndex = 0; slideIndex < segmentMapCopy.length; slideIndex++) {
      const slideCopy = segmentMapCopy[slideIndex];
      
      // Find the shape in the *copy*
      const shapeData = slideCopy.shapes.find(s => s.shapeId === shapeId);
      if (!shapeData) {
        // Not found in this slide, keep looking in the next
        continue;
      }

      // Also find the shape in the *original*
      // This way we can access the *original* paragraphs
      const originalSlide = originalSegmentMap[slideIndex];
      const originalShapeData = originalSlide.shapes.find(s => s.shapeId === shapeId);

      // If it's a TEXT shape, copy updated run text
      if (shapeData.type === "text" && Array.isArray(updatedShape.runs)) {
        // A) Update run text by matching run IDs
        for (const paragraph of shapeData.paragraphs) {
          for (const run of paragraph.runs) {
            const newRun = updatedShape.runs.find((r) => r.id === run.id);
            if (newRun) {
              run.text = newRun.text;
            }
          }
        }

        // B) Now ensure updated paragraphs match original count
        //    NOTE: we use originalShapeData.paragraphs here, not originalSegmentMap[shapeId]
        preserveParagraphBoundaries(
          originalShapeData.paragraphs,
          shapeData.paragraphs
        );

        // C) Recalculate paragraph + run offsets on the shape we just updated
        recalcParagraphAndRunIndices(shapeData);

      } else if (shapeData.type === "table" && Array.isArray(updatedShape.tableCells)) {
        // Example updatedShape.tableCells is:
        // [
        //   { rowIndex: 0, columnIndex: 0, runs: [ ... ] },
        //   { rowIndex: 0, columnIndex: 1, runs: [ ... ] },
        //   ...
        // ]

        // We'll match them up with shapeData.tableCells by row/col
        // We'll match them up with shapeData.tableCells by row/col
        for (const updatedCell of updatedShape.tableCells) {
          if (!Array.isArray(updatedCell.runs)) continue;

          const { rowIndex, columnIndex } = updatedCell;
          const cellData = shapeData.tableCells.find(
            c => c.rowIndex === rowIndex && c.columnIndex === columnIndex
          );
          if (!cellData) continue;

          // Overwrite runs in cellData
          for (const paragraph of cellData.paragraphs) {
            for (const run of paragraph.runs) {
              const newRun = updatedCell.runs.find(r => r.id === run.id);
              if (newRun) {
                run.text = newRun.text;
              }
            }
          }

          // (Optional) If you want to preserve paragraph boundaries in each cell
          // you could do something similar:
          //
          // preserveParagraphBoundaries(
          //   originalCellData.paragraphs,   // from the *original* slide
          //   cellData.paragraphs
          // );
          // but only if your AI returns multiple paragraphs per cell.

          // Recalculate indices for that cell
          recalcParagraphAndRunIndices(cellData);
        }
      }

      // If each shapeId is unique across slides, we can break after we find & update it
      break;
    }
  }

  return segmentMapCopy;
}

module.exports = applyUpdatedRunsToSegmentMap;