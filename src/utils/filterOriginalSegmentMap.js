

function filterOriginalSegmentMap(page) {

    const singlePage = page[0];
    if (!singlePage) {
      // Handle no pages found—return an empty map or throw an error
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
        // Convert shape.tableCells array => shapeMap w/ "rowIndex-colIndex" keys
        const tableCells = [];  // truly an array
        shape.tableCells.forEach((cell) => {
          tableCells.push({
            rowIndex: cell.rowIndex,
            columnIndex: cell.columnIndex,
            paragraphs: cell.paragraphs,
          });
        });

        // Then store:
        originalSegmentMap[shape.shapeId] = {
          type: 'table',
          tableCells,
        };
    }
    // ... handle image, group, etc. if needed
    });
    
    // 2) Build the runs-only map
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
        shapeData.tableCells.forEach((cell) => {
          const cellKey = `${cell.rowIndex}-${cell.columnIndex}`;
          const allRuns = [];
      
          cell.paragraphs.forEach((paragraph) => {
            paragraph.runs.forEach((r) => {
              allRuns.push({ id: r.id, text: r.text });
            });
          });
      
          filteredCells[cellKey] = { runs: allRuns };
        });
      
        runsOnlyMap[shapeId] = {
          type: "table",
          cells: filteredCells,
        };
      }
    }
  
    return runsOnlyMap;
}

module.exports = filterOriginalSegmentMap;