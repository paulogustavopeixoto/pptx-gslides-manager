const preserveParagraphBoundaries = require('./preserveParagraphBoundaries');
const recalcParagraphAndRunIndices = require('./recalcParagraphAndRunIndices');

/**
 * applyUpdatedRunsToSegmentMap
 *
 * Merges the new text from “second prompt” updatedRuns into the originalSegmentMap,
 * matching by run IDs. Then **recalculates** paragraph/runs startIndex/endIndex
 * so they match the new text length.
 *
 * @param  originalSegmentMap - The map built from extractParagraphsAndRuns
 * @param  updatedShapes - The array from secondPrompt’s “content”
 * @returns  A modified copy of originalSegmentMap with updated text + corrected indices
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
    if (origShapeData.type === "text" && updatedShape.paragraphs) {
        for(let p = 0; p < origShapeData.paragraphs.length; p++){
             const origParagraph = origShapeData.paragraphs[p];
             const updatedParagraph = updatedShape.paragraphs[p];

             if(!updatedParagraph) continue;

             // Filter the original runs to only keep the ones present in the updated paragraph
              origParagraph.runs = origParagraph.runs.filter(run => {
                return updatedParagraph.runs.some(newRun => newRun.id === run.id);
              });

           // Update the run text
           for (const run of origParagraph.runs) {
                    const newRun = updatedParagraph.runs.find((r) => r.id === run.id);
                    if (newRun) {
                        run.text = newRun.text;
                    }
           }
        }
    

      // B) Now ensure updated paragraphs match original count
        preserveParagraphBoundaries(
          originalSegmentMap[shapeId].paragraphs,
          origShapeData.paragraphs
        );

      // C) Recalculate paragraph + run offsets
      recalcParagraphAndRunIndices(origShapeData);
    } else if (origShapeData.type === "table" && updatedShape.cells) {
      // updatedShape.cells is an object keyed by "row-col"
      const shapeCells = updatedShape.cells;

      for (const cellKey in shapeCells) {
        const cell = shapeCells[cellKey];
        if (!cell.paragraphs) continue; // or some check

        // Find corresponding cell in originalSegmentMap
        const cellData = origShapeData.cells[cellKey];
        if (!cellData) continue;

          for (let p = 0; p < cellData.paragraphs.length; p++) {
             const origParagraph = cellData.paragraphs[p];
             const updatedParagraph = cell.paragraphs[p];

             if(!updatedParagraph) continue;
            // Filter original runs based on those existing in updated paragraph
             origParagraph.runs = origParagraph.runs.filter(run => {
                 return updatedParagraph.runs.some(newRun => newRun.id === run.id);
             });

              for (const run of origParagraph.runs) {
                  const newRun = updatedParagraph.runs.find((r) => r.id === run.id);
                  if (newRun) {
                      run.text = newRun.text;
                  }
             }
         }


        // 2) Now call preserveParagraphBoundaries
        //    just like you do with text shapes
        preserveParagraphBoundaries(
          originalSegmentMap[shapeId].cells[cellKey].paragraphs,
          cellData.paragraphs
        );

        // 3) Recalculate indices
        recalcParagraphAndRunIndices(cellData);
      }
    }

  }

  return segmentMapCopy;
}

module.exports = applyUpdatedRunsToSegmentMap;