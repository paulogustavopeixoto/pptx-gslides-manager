/**
 * filterOriginalSegmentMap
 * (optional function to produce runsOnlyMap for the second prompt)
 */
function filterOriginalSegmentMap(originalSegmentMap) {
  const runsOnlyMap = {};

  for (const shapeId in originalSegmentMap) {
    const shapeData = originalSegmentMap[shapeId];
    if (shapeData.type === "text") {
      const allRuns = [];
      shapeData.paragraphs.forEach((paragraph) => {
        paragraph.runs.forEach((r) => {
          allRuns.push({ id: r.id, text: r.text });
        });
      });
      runsOnlyMap[shapeId] = {
        type: "text",
        runs: allRuns,
      };
    } else if (shapeData.type === "table") {
      const filteredCells = {};
      for (const cellKey in shapeData.cells) {
        const cellData = shapeData.cells[cellKey];
        const allRuns = [];
        cellData.paragraphs.forEach((paragraph) => {
          paragraph.runs.forEach((r) => {
            allRuns.push({ id: r.id, text: r.text });
          });
        });
        filteredCells[cellKey] = { runs: allRuns };
      }
      runsOnlyMap[shapeId] = {
        type: "table",
        cells: filteredCells,
      };
    }
  }

  return runsOnlyMap;
}

module.exports = filterOriginalSegmentMap;