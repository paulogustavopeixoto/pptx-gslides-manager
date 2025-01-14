
/**
 * recalcParagraphAndRunIndices
 * 
 * Given a shapeData or cellData with `paragraphs: [...]`,
 * we recalculate all paragraphs’ start/end, and each run’s start/end,
 * based on the updated text. For each paragraph, runs are laid out
 * consecutively, possibly ending with a newline if you want to
 * preserve paragraph boundaries.
 *
 * @param {Object} shapeOrCellData - Object that has a `paragraphs` array
 */
function recalcParagraphAndRunIndices(shapeOrCellData) {
    if (!Array.isArray(shapeOrCellData.paragraphs)) return;
  
    let runningIndex = 0;
    for (const paragraph of shapeOrCellData.paragraphs) {
      paragraph.startIndex = runningIndex;
  
      for (const run of paragraph.runs) {
        // Set run’s startIndex
        run.startIndex = runningIndex;
        // endIndex = startIndex + length of the run's text
        run.endIndex = run.startIndex + (run.text?.length || 0);
        runningIndex = run.endIndex;
      }
  
      paragraph.endIndex = runningIndex;
      // Optionally, if you want each paragraph to always end in a `\n`
      // you might do something like:
      // runningIndex += 1; // account for a newline
      // paragraph.endIndex = runningIndex;
    }
  }

module.exports = recalcParagraphAndRunIndices;