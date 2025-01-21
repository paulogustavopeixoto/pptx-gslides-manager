function filterOriginalSegmentMap(page) {
  const singlePage = page[0];
  if (!singlePage) {
    console.warn("filterOriginalSegmentMap called with empty pages array");
    return {};
  }

  // 1) Convert singlePage.shapes (array) into a shape-based map
  const originalSegmentMap = {};
  singlePage.shapes.forEach((shape) => {
    if (shape.type === 'text') {
      originalSegmentMap[shape.shapeId] = {
        type: 'text',
        paragraphs: shape.paragraphs,
      };
    } else if (shape.type === 'table' && Array.isArray(shape.tableCells)) {
      // Keep tableCells as an array of objects
      originalSegmentMap[shape.shapeId] = {
        type: 'table',
        tableCells: shape.tableCells,
      };
    }
    // else if (shape.type === 'image'|... handle other shape types as needed)
  });

  // 2) Build the "runs-only" map
  //    But keep tables in an array format
  const runsOnlyMap = {};
  for (const shapeId in originalSegmentMap) {
    const shapeData = originalSegmentMap[shapeId];

    if (shapeData.type === "text") {
      // Flatten runs across all paragraphs
      const allRuns = [];
      shapeData.paragraphs.forEach((paragraph) => {
        if (paragraph.runs) {
          paragraph.runs.forEach((r) => {
            allRuns.push({ id: r.id, text: r.text });
          });
        }
      });

      runsOnlyMap[shapeId] = {
        type: "text",
        runs: allRuns
      };

    } else if (shapeData.type === "table") {
      // Keep the array structure, but gather runs for each cell
      const newTableCells = shapeData.tableCells.map((cell) => {
        const allRuns = [];
        cell.paragraphs.forEach((paragraph) => {
          if (paragraph.runs) {
            paragraph.runs.forEach((r) => {
              allRuns.push({ id: r.id, text: r.text });
            });
          }
        });

        // Return cell info + runs
        return {
          rowIndex: cell.rowIndex,
          columnIndex: cell.columnIndex,
          runs: allRuns,
        };
      });

      runsOnlyMap[shapeId] = {
        type: "table",
        tableCells: newTableCells
      };
    }
  }

  return runsOnlyMap;
}

module.exports = filterOriginalSegmentMap;