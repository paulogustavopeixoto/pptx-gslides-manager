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
            // Only apply if 'customization' is 'CUSTOM' (as in your original code)
            if (newRun && updatedShape.customization === 'CUSTOM') {
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

      } else if (shapeData.type === "table" && updatedShape.cells) {
        // updatedShape.cells is an object keyed by "row-col"
        const shapeCells = updatedShape.cells;

        for (const cellKey in shapeCells) {
          const cell = shapeCells[cellKey];
          if (!cell.runs) continue; // or some check

          // Find corresponding cell in shapeData
          const cellData = shapeData.cells[cellKey];
          if (!cellData) continue;

          // cell.runs is your new text runs; so loop over original paragraphs & runs
          const updatedRuns = cell.runs;
          for (const paragraph of cellData.paragraphs) {
            for (const run of paragraph.runs) {
              const newRun = updatedRuns.find(r => r.id === run.id);
              if (newRun) {
                run.text = newRun.text;
              }
            }
          }

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