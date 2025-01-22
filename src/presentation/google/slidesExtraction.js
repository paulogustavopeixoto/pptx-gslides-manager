const { google } = require("googleapis");

/**
 * Returns an array of slides. Each slide in the array has:
 *   {
 *     slideNumber: number,
 *     pageObjectId: string,
 *     shapes: [
 *       {
 *         shapeId: string,
 *         type: "text" | "table" | "image" | "group" | etc.,
 *         text: string,          // Plaintext extracted from runs (if text shape)
 *         paragraphs: [...],    // Detailed paragraphs/runs for text shapes
 *         tableCells: [         // For tables: an array of cell objects
 *           {
 *             rowIndex: number,
 *             columnIndex: number,
 *             paragraphs: [...],
 *             text: string,
 *           },
 *           ...
 *         ],
 *         imageUrl: string,     // If it's an image shape
 *         ...
 *       },
 *       ...
 *     ]
 *   }
 *
 * If `pageObjectId` is provided, only return that single slide (or empty if not found).
 *
 * @param {object} auth - Authenticated google.auth.JWT or OAuth2 client.
 * @param {object} presentation - The object the Google Slides presentation resulted from the getPresentation function.
 * @param {string|null} pageObjectId - If set, only return the slide with this ID. Otherwise return all slides.
 * @returns {Promise<object>} Object of slide.
 */
async function getSlides(presentation, pageObjectId) {

  const originalSegmentMap = {};

  const targetSlide = presentation.data.slides.find(
    (slide) => slide.objectId === pageObjectId
  );

  if (targetSlide && targetSlide.pageElements) {
    targetSlide.pageElements.forEach((pe) => {
      //console.log(`shape ${pe.objectId} object:`, JSON.stringify(pe, null, 4));
      const shapeId = pe.objectId;

      if (pe.shape && pe.shape.text && pe.shape.text.textElements) {
        const paragraphs = extractParagraphsAndRuns(pe.shape.text.textElements);    
        originalSegmentMap[shapeId] = {
          type: "text",
          paragraphs,
        };
      } else if (pe.table) {
        originalSegmentMap[shapeId] = { type: "table", cells: {} };
        if (pe.table.tableRows) {
          pe.table.tableRows.forEach((row, rIndex) => {
            row.tableCells.forEach((cell, cIndex) => {
              if (cell.text && cell.text.textElements) {
                const paragraphs = extractParagraphsAndRuns(cell.text.textElements);
                originalSegmentMap[shapeId].cells[`${rIndex}-${cIndex}`] = {
                  paragraphs,
                };
              }
            });
          });
        }
      } else if (pe.elementGroup) {
        // Instead of creating a "group" in the map, just recurse into the children
        if (
          Array.isArray(pe.elementGroup.children) && 
          pe.elementGroup.children.length > 0
        ) {
          pe.elementGroup.children.forEach((child) => {
            // Pass the top-level originalSegmentMap so children 
            // get stored at the same level
            handleChildElement(child, originalSegmentMap);
          });
        }
      } else if (pe.image) {
        originalSegmentMap[shapeId] = {
          type: "image",
          imageUrl: pe.image.contentUrl || null,
        };
      }
    });
  }

  return originalSegmentMap;
}

/**
 * handleChildElement:
 * Recursively process child elements inside a group (or nested groups).
 * 
 * This version FLATTENS groups so that we do NOT store a "group" entry.
 * Instead, we only store the shapes/tables inside those groups.
 */
function handleChildElement(element, originalSegmentMap) {
  const childId = element.objectId || generateTempId(); // fallback if no objectId

  // 1) Is it a text shape?
  if (element.shape && element.shape.text && element.shape.text.textElements) {
    const paragraphs = extractParagraphsAndRuns(element.shape.text.textElements);
    originalSegmentMap[childId] = {
      type: "text",
      paragraphs,
    };
  } 
  // 2) Or a table?
  else if (element.table) {
    originalSegmentMap[childId] = { type: "table", cells: {} };
    if (element.table.tableRows) {
      element.table.tableRows.forEach((row, rIndex) => {
        row.tableCells.forEach((cell, cIndex) => {
          if (cell.text && cell.text.textElements) {
            const paragraphs = extractParagraphsAndRuns(cell.text.textElements);
            originalSegmentMap[childId].cells[`${rIndex}-${cIndex}`] = { paragraphs };
          }
        });
      });
    }
  }
  // 3) If it's a group, we do NOT create a "group" entry.
  //    Instead, we just recurse into the children so they appear at the same level.
  else if (element.elementGroup) {
    if (Array.isArray(element.elementGroup.children)) {
      element.elementGroup.children.forEach((nestedChild) => {
        handleChildElement(nestedChild, originalSegmentMap);
      });
    }
  }

  // If it's some other kind of element (e.g. a diagram or WordArt),
  // you might need to handle that separately.
}

/**
 * Extract paragraphs and runs from text elements in a shape.
 *
 * @param {Array} textElements - shape.text.textElements from the Slides API
 * @returns {Array} Array of paragraph objects
 */
function extractParagraphsAndRuns(textElements) {

  const paragraphs = [];
  let currentParagraph = null;
  let paragraphCounter = 0;
  let runCounter = 0;
  let currentIndex = 0;

  for (const te of textElements) {
    // If we see a paragraphMarker, close the previous paragraph, start a new one
    if (te.paragraphMarker) {
      if (currentParagraph) {
        // finalize endIndex of the old paragraph
        if (currentParagraph.runs.length) {
          currentParagraph.endIndex = currentParagraph.runs[currentParagraph.runs.length - 1].endIndex;
        }
        paragraphs.push(currentParagraph);
      }
      currentParagraph = {
        id: `paragraph-${paragraphCounter++}`,
        startIndex: currentIndex,
        endIndex: te.endIndex,
        paragraphStyle: te.paragraphMarker.style || {},
        bullet: te.paragraphMarker.bullet || null,
        runs: [],
      };
    }

    // If it's a textRun, append it to the current paragraph
    if (te.textRun && te.textRun.content) {
      const text = te.textRun.content;
      const length = text.length;
      const style = te.textRun.style || {};

      const runObj = {
        id: `run-${runCounter++}`,
        startIndex: currentIndex,
        endIndex: currentIndex + length,
        text,
        style,
      };

      currentIndex += length;
      if (currentParagraph) {
        currentParagraph.runs.push(runObj);
      }
    }
  }

  // finalize the last paragraph if open
  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
}

module.exports = getSlides;