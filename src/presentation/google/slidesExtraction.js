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
  //console.log(`Found ${slidesData.length} slides in the presentation: ${JSON.stringify(slidesData, null, 4)}`);
  const pages = []; // The array of slides we'll return

  // -------------------------------------------------
  // Process each slide in the presentation
  // -------------------------------------------------
  slidesData.forEach((slide, index) => {
    console.log(`Found slide in the presentation: ${JSON.stringify(slide, null, 4)}`);
    const slideNumber = index + 1;
    const pageObject = {
      slideNumber,
      pageObjectId: slide.objectId,
      shapes: [],
    };

    const shapeOrder = { order: 1 }; // increment as we process shapes

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
    return pages.filter((p) => p.pageObjectId === pageObjectId);
  } else {
    return pages;
  }
}

// ------------------------------------------------------------------------
// processElement: parse each element into a "shape" object
// ------------------------------------------------------------------------
function processElement(element, shapesArray, shapeOrder) {
  if (!element.objectId) return;

  const shapeObj = {
    shapeId: element.objectId,
    order: shapeOrder.order++,
  };

  // 1) Text Shape
  if (element.shape && element.shape.text) {
    shapeObj.type = "text";

    // Extract paragraphs/runs
    const paragraphs = extractParagraphsAndRuns(element.shape.text.textElements);
    shapeObj.paragraphs = paragraphs;

    // Combine all runs into plaintext
    const plainText = paragraphs
      .flatMap((para) => para.runs)
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
    // We'll store each cell as an entry in shapeObj.tableCells (an array)
    shapeObj.tableCells = [];

    if (Array.isArray(element.table.tableRows)) {
      element.table.tableRows.forEach((row, rowIndex) => {
        if (Array.isArray(row.tableCells)) {
          row.tableCells.forEach((cell, columnIndex) => {
            let paragraphs = [];
            let plainText = "";

            if (cell.text && cell.text.textElements) {
              paragraphs = extractParagraphsAndRuns(cell.text.textElements);
              plainText = paragraphs
                .flatMap((p) => p.runs)
                .map((r) => r.text)
                .join("");
            }

            shapeObj.tableCells.push({
              rowIndex,
              columnIndex,
              paragraphs,
              text: plainText,
            });
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
    // Flatten children or push the group shape itself if needed
    if (Array.isArray(element.elementGroup.children)) {
      element.elementGroup.children.forEach((child) => {
        processElement(child, shapesArray, shapeOrder);
      });
    }
    // shapesArray.push(shapeObj) if you want a group object
    return;
  }

  // 4) Image
  else if (element.image) {
    shapeObj.type = "image";
    shapeObj.imageUrl = element.image.contentUrl || null;
    shapesArray.push(shapeObj);
    return;
  }

  // 5) Fallback / Unknown
  shapeObj.type = "unknown";
  shapesArray.push(shapeObj);
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