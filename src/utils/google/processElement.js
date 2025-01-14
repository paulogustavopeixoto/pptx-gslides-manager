// src/googleSlides/shapesAndTables.js
const { rgbToHex, applyBBCode, normalizeBBCodeAcrossNewlines } = require("../utils");

/**
 * Recursively processes an element from the Slides API, extracting shapes (text, tables, images),
 * and pushing them into the `shapesWithText` array.
 *
 * @param {object} element - The element object from the Slides API (pageElement, group child, etc.).
 * @param {object[]} shapesWithText - The array to which processed shape objects are added.
 * @param {object} shapeOrder - An object holding a numerical `order` field, used to track shape sequence.
 */
function processElement(element, shapesWithText, shapeOrder) {
  let textContent = "";
  let shapeType = "";

  /**
   * 1) Standard Text Shape
   */
  if (element.shape && element.shape.text) {
    const textElements = element.shape.text.textElements || [];

    // Collect text runs & formatting
    const runs = [];
    textElements.forEach((textElement) => {
      if (textElement.textRun) {
        const content = textElement.textRun.content || "";
        if (content) {
          const textStyle = textElement.textRun.style || {};

          // Extract formatting options
          const isBold = textStyle.bold || false;
          const isItalic = textStyle.italic || false;
          const isUnderlined = textStyle.underline || false;
          const isStrikeThrough = textStyle.strikethrough || false;
          const fontSize = textStyle.fontSize
            ? textStyle.fontSize.magnitude + (textStyle.fontSize.unit || "pt")
            : null;
          const foregroundColor = textStyle.foregroundColor
            ? textStyle.foregroundColor.opaqueColor.rgbColor
            : null;

          runs.push({
            text: content,
            bold: isBold,
            italic: isItalic,
            underline: isUnderlined,
            strikeThrough: isStrikeThrough,
            fontSize: fontSize,
            fontColor: foregroundColor ? rgbToHex(foregroundColor) : null,
          });
        }
      }
    });

    // Combine all text runs into a single plain text string
    textContent = runs.map((r) => r.text).join("");
    shapeType = "text";
  }

  /**
   * 2) Table
   */
  else if (element.table) {
    shapeType = "table";
    const tableCells = [];

    if (Array.isArray(element.table.tableRows)) {
      element.table.tableRows.forEach((row, rowIndex) => {
        if (Array.isArray(row.tableCells)) {
          row.tableCells.forEach((cell, columnIndex) => {
            const cellTextElements = [];
            let cellTextContent = "";
            let cellTextFormatted = "";

            if (cell.text && cell.text.textElements) {
              cell.text.textElements.forEach((textElement) => {
                if (textElement.textRun) {
                  const content = textElement.textRun.content || "";
                  if (content) {
                    const textStyle = textElement.textRun.style || {};

                    // Extract formatting options
                    const isBold = textStyle.bold || false;
                    const isItalic = textStyle.italic || false;
                    const isUnderlined = textStyle.underline || false;
                    const isStrikeThrough = textStyle.strikethrough || false;
                    const fontSize = textStyle.fontSize
                      ? textStyle.fontSize.magnitude + (textStyle.fontSize.unit || "pt")
                      : null;
                    const foregroundColor = textStyle.foregroundColor
                      ? textStyle.foregroundColor.opaqueColor.rgbColor
                      : null;

                    cellTextElements.push({
                      text: content,
                      bold: isBold,
                      italic: isItalic,
                      underline: isUnderlined,
                      strikeThrough: isStrikeThrough,
                      fontSize: fontSize,
                      fontColor: foregroundColor ? rgbToHex(foregroundColor) : null,
                    });

                    // Append to BBCode-formatted string (if needed)
                    cellTextFormatted += applyBBCode(content, {
                      bold: isBold,
                      italic: isItalic,
                      underline: isUnderlined,
                    });
                    cellTextFormatted = normalizeBBCodeAcrossNewlines(cellTextFormatted);
                  }
                }
              });

              // Combine all text elements into a single plain text string
              cellTextContent = cellTextElements.map((te) => te.text).join("");

              // Add the cell data to the tableCells array
              tableCells.push({
                rowIndex,
                columnIndex,
                text: cellTextContent,
                // textElements: cellTextElements,
                // textFormatted: cellTextFormatted,
              });
            }
          });
        }
      });
    }

    // Add the table shape to the shapesWithText array
    shapesWithText.push({
      shapeId: element.objectId,
      type: shapeType,
      tableCells,
      order: shapeOrder.order++,
    });

    // Return early since we've handled the table in one go
    return;
  }

  /**
   * 3) Element Group
   */
  else if (element.elementGroup) {
    if (Array.isArray(element.elementGroup.children)) {
      element.elementGroup.children.forEach((childElement) => {
        processElement(childElement, shapesWithText, shapeOrder);
      });
    } else {
      console.warn("Group has no children:", element);
    }
    // Return early because groups don't hold direct text content
    return;
  }

  /**
   * 4) Image
   */
  else if (element.image) {
    shapeType = "image";
    shapesWithText.push({
      shapeId: element.objectId,
      type: shapeType,
      imageUrl: element.image.contentUrl || null,
      order: shapeOrder.order++,
    });
    console.log("Image shape:", element.image.contentUrl);
    return;
  }

  // If textContent is non-empty (i.e. shapeType = 'text'), push it
  if (textContent) {
    shapesWithText.push({
      shapeId: element.objectId,
      text: textContent,
      characterCount: textContent.length,
      order: shapeOrder.order++,
      type: shapeType,
    });
  }
}

module.exports = processElement;