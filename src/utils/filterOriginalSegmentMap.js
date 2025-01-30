/**
 * filterOriginalSegmentMap
 * (optional function to produce runsOnlyMap for the second prompt)
 */
function filterOriginalSegmentMap(originalSegmentMap) {
  const runsOnlyMap = {};

  for (const shapeId in originalSegmentMap) {
    const shapeData = originalSegmentMap[shapeId];
    if (shapeData.type === "text") {
      const filteredParagraphs = [];
      shapeData.paragraphs.forEach((paragraph, index) => { // Added index
          const allRuns = [];
          paragraph.runs.forEach((r) => {
            allRuns.push({ id: r.id, text: r.text });
          });
          filteredParagraphs.push({ id: `paragraph-${index}`, runs: allRuns }); // Added paragraph ID
      });
      runsOnlyMap[shapeId] = {
        type: "text",
        paragraphs: filteredParagraphs,
      };
    } else if (shapeData.type === "table") {
      const filteredCells = {};
      for (const cellKey in shapeData.cells) {
        const cellData = shapeData.cells[cellKey];
        const filteredParagraphs = [];
        cellData.paragraphs.forEach((paragraph, index) => { // Added index
          const allRuns = [];
          paragraph.runs.forEach((r) => {
            allRuns.push({ id: r.id, text: r.text });
          });
          filteredParagraphs.push({ id: `paragraph-${index}`, runs: allRuns }); // Added paragraph ID
        });
        filteredCells[cellKey] = { paragraphs: filteredParagraphs };
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