

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
      const origShapeData = segmentMapCopy[shapeId];
      if (!origShapeData) {
        // The shape ID wasn't found in the map; skip
        continue;
      }
  
      // If it's a TEXT shape, copy updated run text
      if (origShapeData.type === "text" && Array.isArray(updatedShape.runs)) {
        // A) Update run text by matching run IDs
        for (const paragraph of origShapeData.paragraphs) {
          for (const run of paragraph.runs) {
            const newRun = updatedShape.runs.find((r) => r.id === run.id);
            if (newRun && updatedShape.customization === 'CUSTOM') {
              run.text = newRun.text;
            }
          }
        }
  
        // B) Now ensure updated paragraphs match original count
        preserveParagraphBoundaries(
          originalSegmentMap[shapeId].paragraphs,
          origShapeData.paragraphs
        );
  
        // B) Recalculate paragraph + run offsets
        recalcParagraphAndRunIndices(origShapeData);
  
      } else if (origShapeData.type === "table" && updatedShape.cells) {
        // updatedShape.cells is an object keyed by "row-col"
        const shapeCells = updatedShape.cells; 
      
        for (const cellKey in shapeCells) {
          const cell = shapeCells[cellKey];
          if (!cell.runs) continue; // or some check
      
          // Find corresponding cell in originalSegmentMap
          const cellData = origShapeData.cells[cellKey];
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
  
      // (Optionally) preserve the "customization" field, if desired
      // e.g. segmentMapCopy[shapeId].customization = updatedShape.customization;
    }
  
    return segmentMapCopy;
  }

module.exports = applyUpdatedRunsToSegmentMap;