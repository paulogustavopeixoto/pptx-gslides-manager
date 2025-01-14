// src/googleSlides/getSlides.js
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
 *         text: string,                // Plaintext extracted from runs (if text shape)
 *         paragraphs: [...],          // Detailed paragraphs/runs for text or table cells
 *         tableCells: [ {...}, ... ], // If it's a table, each cell with text/paragraphs
 *         imageUrl: string,           // If it's an image shape
 *         // etc.
 *       },
 *       ...
 *     ]
 *   }
 *
 * If `pageObjectId` is provided, we filter the final array so only that
 * single slide object is returned. If none is found with that ID, the array is empty.
 *
 * @param {object} auth - Authenticated google.auth.JWT or OAuth2 client.
 * @param {string} presentationId - The ID of the Google Slides presentation.
 * @param {string|null} pageObjectId - If set, only return the slide with this ID. Otherwise return all slides.
 * @returns {Promise<Array>} Array of slide objects (possibly length 1 if pageObjectId was given).
 */
async function getSlides(auth, presentationId, pageObjectId = null) {
  const slidesService = google.slides({ version: "v1", auth });
  let presentation;
  try {
    presentation = await slidesService.presentations.get({ presentationId });
  } catch (error) {
    console.error("Error retrieving presentation:", error);
    throw error;
  }

  const slidesData = presentation.data.slides || [];
  const pages = []; // The array of slides we'll return

  // -------------------------------------------------
  // Process each slide in the presentation
  // -------------------------------------------------
  slidesData.forEach((slide, index) => {
    const slideNumber = index + 1;
    const pageObject = {
      slideNumber,
      pageObjectId: slide.objectId,
      shapes: [],
    };

    // shapeOrder just if you want a sequential "order" for shapes
    const shapeOrder = { order: 1 };

    if (slide.pageElements) {
      slide.pageElements.forEach((element) => {
        processElement(element, pageObject.shapes, shapeOrder);
      });
    }

    pages.push(pageObject);
  });

  // -------------------------------------------------
  // If pageObjectId is provided, filter down
  // -------------------------------------------------
  if (pageObjectId) {
    // We only keep the page(s) that match the ID
    // (Typically, there should only be 1 match)
    return pages.filter((p) => p.pageObjectId === pageObjectId);
  } else {
    // Otherwise, return all
    return pages;
  }
}

// ------------------------------------------------------------------------
// processElement: Similar to your snippet, but includes 'paragraphs' array
// for text and for table cells, so we always store the runs. This ensures
// consistent structure for shapes in the final array.
// ------------------------------------------------------------------------
function processElement(element, shapesArray, shapeOrder) {
  if (!element.objectId) return; // Sometimes there's no objectId?

  // We’ll build a shape object, then push it to shapesArray
  const shapeObj = {
    shapeId: element.objectId,
    order: shapeOrder.order++,
  };

  // 1) Standard Text Shape
  if (element.shape && element.shape.text) {
    shapeObj.type = "text";
    // Extract paragraphs/runs
    const paragraphs = extractParagraphsAndRuns(element.shape.text.textElements);
    shapeObj.paragraphs = paragraphs;

    // Combine all runs into plaintext
    const plainText = paragraphs
      .flatMap((para) => para.runs)  // gather all runs from all paragraphs
      .map((r) => r.text)
      .join("");
    shapeObj.text = plainText;
    shapeObj.characterCount = plainText.length;

    shapesArray.push(shapeObj);
    return;
  }

  // 2) Table
  else if (element.table) {
    shapeObj.type = "table";
    shapeObj.tableCells = []; // We'll store rowIndex, colIndex, plus text & paragraphs

    if (Array.isArray(element.table.tableRows)) {
      element.table.tableRows.forEach((row, rowIndex) => {
        if (Array.isArray(row.tableCells)) {
          row.tableCells.forEach((cell, columnIndex) => {
            if (cell.text && cell.text.textElements) {
              // Extract paragraphs
              const paragraphs = extractParagraphsAndRuns(cell.text.textElements);
              // Combine runs into plain text
              const plainText = paragraphs
                .flatMap((para) => para.runs)
                .map((r) => r.text)
                .join("");

              shapeObj.tableCells.push({
                rowIndex,
                columnIndex,
                text: plainText,
                paragraphs,
              });
            } else {
              // Even an empty cell is included?
              shapeObj.tableCells.push({
                rowIndex,
                columnIndex,
                text: "",
                paragraphs: [],
              });
            }
          });
        }
      });
    }

    shapesArray.push(shapeObj);
    return;
  }

  // 3) Groups
  else if (element.elementGroup) {
    shapeObj.type = "group";
    // We could store child shapes here, or flatten them into shapesArray
    // For demonstration, let's flatten them at top-level:
    if (Array.isArray(element.elementGroup.children)) {
      element.elementGroup.children.forEach((child) => {
        processElement(child, shapesArray, shapeOrder);
      });
    }
    // We won't push "group" as a separate shape to shapesArray unless you want to
    return;
  }

  // 4) Image
  else if (element.image) {
    shapeObj.type = "image";
    shapeObj.imageUrl = element.image.contentUrl || null;
    shapesArray.push(shapeObj);
    return;
  }

  // 5) If we didn't match text, table, group, or image...
  // we can either push a shape with type "unknown" or skip it
  shapeObj.type = "unknown";
  shapesArray.push(shapeObj);
}

/**
 * Extracts paragraphs and runs from Google Slides text elements, preserving
 * startIndex/endIndex. This lets you reapply formatting accurately later.
 *
 * @param {Array} textElements - The array of text elements from Slides API (shape.text.textElements).
 * @returns {Array} An array of paragraph objects, each containing metadata and an array of runs.
 *
 * Each paragraph object has the shape:
 * {
 *   id: string,
 *   startIndex: number,
 *   endIndex: number,
 *   paragraphStyle: object,
 *   bullet: object | null,
 *   runs: [
 *     {
 *       id: string,
 *       startIndex: number,
 *       endIndex: number,
 *       text: string,
 *       style: object
 *     },
 *     ...
 *   ]
 * }
 */
function extractParagraphsAndRuns(textElements) {
  const paragraphs = [];

  let currentParagraph = null;
  let paragraphCounter = 0;
  let runCounter = 0;
  let currentIndex = 0;

  for (const te of textElements) {
    // If we see a paragraphMarker, close the previous paragraph, then start a new one
    if (te.paragraphMarker) {
      // If there is an open paragraph, finalize its endIndex
      if (currentParagraph) {
        currentParagraph.endIndex = te.endIndex;
        paragraphs.push(currentParagraph);
      }
      // Create a new paragraph
      currentParagraph = {
        id: `paragraph-${paragraphCounter++}`,
        startIndex: currentIndex,
        endIndex: te.endIndex,
        paragraphStyle: te.paragraphMarker.style || {},
        bullet: te.paragraphMarker.bullet || null,
        runs: [],
      };
    }

    // If it's a text run, attach it to currentParagraph (if any)
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

  // If we ended with an open paragraph, finalize it
  if (currentParagraph) {
    // Optionally set endIndex to currentIndex for the last paragraph
    currentParagraph.endIndex = currentIndex;
    paragraphs.push(currentParagraph);
  }

  return paragraphs;
}


// ------------------------------------------------------------------------
// Export
// ------------------------------------------------------------------------
module.exports = getSlides;