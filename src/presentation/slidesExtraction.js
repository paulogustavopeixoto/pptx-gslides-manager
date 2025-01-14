const { google } = require("googleapis");


const getSlides = {
    google: async function (auth, presentationId) {
        try {
            const slidesService = google.slides({ version: 'v1', auth });
            const presentationData = await slidesService.presentations.get({ presentationId });
            const slidesData = presentationData.data.slides;
            const slidesWithText = [];
        
            // Function to recursively process elements and groups  
            function processElement(element, shapesWithText, shapeOrder) {
              let textContent = '';
              let shapeType = '';
              const textElementsWithFormatting = [];
            
            
              if (element.shape && element.shape.text) {
                // Handle standard shape text with formatting
                element.shape.text.textElements.forEach((textElement) => {
                  if (textElement.textRun) {
                    const content = textElement.textRun.content;
                    if (content) {
                      const textStyle = textElement.textRun.style || {};
            
                      // Extract formatting options
                      const isBold = textStyle.bold || false;
                      const isItalic = textStyle.italic || false;
                      const isUnderlined = textStyle.underline || false;
                      const isStrikeThrough = textStyle.strikethrough || false;
                      const fontSize = textStyle.fontSize
                        ? textStyle.fontSize.magnitude + (textStyle.fontSize.unit || 'pt')
                        : null;
                      const foregroundColor = textStyle.foregroundColor
                        ? textStyle.foregroundColor.opaqueColor.rgbColor
                        : null;
            
                      // Store individual text elements with formatting
                      textElementsWithFormatting.push({
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
            
                // Combine all text elements into a single plain text string
                textContent = textElementsWithFormatting.map((te) => te.text).join('');
                shapeType = 'text';
              } else if (element.table) {
                // Handle table text
                shapeType = 'table';
                const tableCells = [];
                if (Array.isArray(element.table.tableRows)) {
                  element.table.tableRows.forEach((row, rowIndex) => {
                    if (Array.isArray(row.tableCells)) {
                      row.tableCells.forEach((cell, columnIndex) => {
                        const cellTextElements = [];
                        let cellTextContent = '';
                        let cellTextFormatted = '';
            
                        if (cell.text && cell.text.textElements) {
                          cell.text.textElements.forEach((textElement) => {
                            if (textElement.textRun) {
                              const content = textElement.textRun.content;
                              if (content) {
                                const textStyle = textElement.textRun.style || {};
            
                                // Extract formatting options
                                const isBold = textStyle.bold || false;
                                const isItalic = textStyle.italic || false;
                                const isUnderlined = textStyle.underline || false;
                                const isStrikeThrough = textStyle.strikethrough || false;
                                const fontSize = textStyle.fontSize
                                  ? textStyle.fontSize.magnitude + (textStyle.fontSize.unit || 'pt')
                                  : null;
                                const foregroundColor = textStyle.foregroundColor
                                  ? textStyle.foregroundColor.opaqueColor.rgbColor
                                  : null;
            
                                // Store individual text elements with formatting
                                cellTextElements.push({
                                  text: content,
                                  bold: isBold,
                                  italic: isItalic,
                                  underline: isUnderlined,
                                  strikeThrough: isStrikeThrough,
                                  fontSize: fontSize,
                                  fontColor: foregroundColor ? rgbToHex(foregroundColor) : null,
                                });
            
                                // Append to BBCode-formatted string
                                cellTextFormatted += applyBBCode(content, { bold: isBold, italic: isItalic, underline: isUnderlined });
                                cellTextFormatted = normalizeBBCodeAcrossNewlines(cellTextFormatted);
                              }
                            }
                          });
            
                          // Combine all text elements into a single plain text string
                          cellTextContent = cellTextElements.map((te) => te.text).join('');
            
                          // Add the cell data to the tableCells array
                          tableCells.push({
                            rowIndex,
                            columnIndex,
                            text: cellTextContent
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
            
                return; // Return early since we've processed the table
              } else if (element.elementGroup) {
                //console.log('Processing group:', JSON.stringify(element, null, 2));
                // Handle group elements by recursively processing their children
                if (Array.isArray(element.elementGroup.children)) {
                  //console.log('Processing group children:', element.elementGroup.children);
                  element.elementGroup.children.forEach((childElement) => {
                    processElement(childElement, shapesWithText, shapeOrder);
                  });
                } else {
                  console.warn('Group has no children:', element);
                }
                return; // Return early since group elements don't contain text directly
              } else if (element.image) {
                shapeType = 'image';
                shapesWithText.push({
                  shapeId: element.objectId,
                  type: shapeType,
                  imageUrl: element.image.contentUrl || null,
                  order: shapeOrder.order++,
                });
                console.log('Image shape:', element.image.contentUrl);
                return; 
              }
            
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
        
            // Process each slide
            slidesData.forEach((slide, index) => {
              const slideNumber = index + 1;
              const shapesWithText = [];
              let shapeOrder = { order: 1 }; // Use object to allow modification in recursive calls
        
              slide.pageElements.forEach((element) => {
                processElement(element, shapesWithText, shapeOrder);
              });
        
              slidesWithText.push({
                slideNumber,
                shapes: shapesWithText, // Store shapes including text boxes and tables
                pageObjectId: slide.objectId,
              });
            });
        
            return slidesWithText;
        
          } catch (error) {
            console.error('Error retrieving slides with text shapes:', error);
            throw error;
          }
    }
}

module.exports = getSlides;


// Get slide numbers and all shapes containing text with their positions
async function getSlidesWithTextBoxes(auth, presentationId) {
    try {
      const slidesService = google.slides({ version: 'v1', auth });
      const presentationData = await slidesService.presentations.get({ presentationId });
      const slidesData = presentationData.data.slides;
      const slidesWithText = [];
  
      // Function to recursively process elements and groups  
      function processElement(element, shapesWithText, shapeOrder) {
        let textContent = '';
        //let textFormatted = '';
        let shapeType = '';
        const textElementsWithFormatting = [];
      
        // Compute the transform by combining parent and element transforms
        const elementTransform = element.transform || {};
        //const combinedTransform = combineTransforms(parentTransform, elementTransform);
      
        if (element.shape && element.shape.text) {
          // Handle standard shape text with formatting
          element.shape.text.textElements.forEach((textElement) => {
            if (textElement.textRun) {
              const content = textElement.textRun.content;
              if (content) {
                const textStyle = textElement.textRun.style || {};
      
                // Extract formatting options
                const isBold = textStyle.bold || false;
                const isItalic = textStyle.italic || false;
                const isUnderlined = textStyle.underline || false;
                const isStrikeThrough = textStyle.strikethrough || false;
                const fontSize = textStyle.fontSize
                  ? textStyle.fontSize.magnitude + (textStyle.fontSize.unit || 'pt')
                  : null;
                const foregroundColor = textStyle.foregroundColor
                  ? textStyle.foregroundColor.opaqueColor.rgbColor
                  : null;
      
                // Store individual text elements with formatting
                textElementsWithFormatting.push({
                  text: content,
                  bold: isBold,
                  italic: isItalic,
                  underline: isUnderlined,
                  strikeThrough: isStrikeThrough,
                  fontSize: fontSize,
                  fontColor: foregroundColor ? rgbToHex(foregroundColor) : null,
                });
      
                // Append to BBCode-formatted string
                //textFormatted += applyBBCode(content, { bold: isBold, italic: isItalic, underline: isUnderlined, strikeThrough: isStrikeThrough, color: foregroundColor ? rgbToHex(foregroundColor) : null,  });
                //textFormatted = normalizeBBCodeAcrossNewlines(textFormatted);
              }
            }
          });
      
          // Combine all text elements into a single plain text string
          textContent = textElementsWithFormatting.map((te) => te.text).join('');
          shapeType = 'text';
        } else if (element.table) {
          // Handle table text
          shapeType = 'table';
          const tableCells = [];
          if (Array.isArray(element.table.tableRows)) {
            element.table.tableRows.forEach((row, rowIndex) => {
              if (Array.isArray(row.tableCells)) {
                row.tableCells.forEach((cell, columnIndex) => {
                  const cellTextElements = [];
                  let cellTextContent = '';
                  let cellTextFormatted = '';
      
                  if (cell.text && cell.text.textElements) {
                    cell.text.textElements.forEach((textElement) => {
                      if (textElement.textRun) {
                        const content = textElement.textRun.content;
                        if (content) {
                          const textStyle = textElement.textRun.style || {};
      
                          // Extract formatting options
                          const isBold = textStyle.bold || false;
                          const isItalic = textStyle.italic || false;
                          const isUnderlined = textStyle.underline || false;
                          const isStrikeThrough = textStyle.strikethrough || false;
                          const fontSize = textStyle.fontSize
                            ? textStyle.fontSize.magnitude + (textStyle.fontSize.unit || 'pt')
                            : null;
                          const foregroundColor = textStyle.foregroundColor
                            ? textStyle.foregroundColor.opaqueColor.rgbColor
                            : null;
      
                          // Store individual text elements with formatting
                          cellTextElements.push({
                            text: content,
                            bold: isBold,
                            italic: isItalic,
                            underline: isUnderlined,
                            strikeThrough: isStrikeThrough,
                            fontSize: fontSize,
                            fontColor: foregroundColor ? rgbToHex(foregroundColor) : null,
                          });
      
                          // Append to BBCode-formatted string
                          cellTextFormatted += applyBBCode(content, { bold: isBold, italic: isItalic, underline: isUnderlined });
                          cellTextFormatted = normalizeBBCodeAcrossNewlines(cellTextFormatted);
                        }
                      }
                    });
      
                    // Combine all text elements into a single plain text string
                    cellTextContent = cellTextElements.map((te) => te.text).join('');
      
                    // Add the cell data to the tableCells array
                    tableCells.push({
                      rowIndex,
                      columnIndex,
                      text: cellTextContent,
                      //textElements: cellTextElements,
                      //textFormatted: cellTextFormatted,
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
      
          return; // Return early since we've processed the table
        } else if (element.elementGroup) {
          //console.log('Processing group:', JSON.stringify(element, null, 2));
          // Handle group elements by recursively processing their children
          if (Array.isArray(element.elementGroup.children)) {
            //console.log('Processing group children:', element.elementGroup.children);
            element.elementGroup.children.forEach((childElement) => {
              processElement(childElement, shapesWithText, shapeOrder);
            });
          } else {
            console.warn('Group has no children:', element);
          }
          return; // Return early since group elements don't contain text directly
        } else if (element.image) {
          shapeType = 'image';
          shapesWithText.push({
            shapeId: element.objectId,
            type: shapeType,
            imageUrl: element.image.contentUrl || null,
            order: shapeOrder.order++,
          });
          console.log('Image shape:', element.image.contentUrl);
          return; 
        }
      
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
  
      // Process each slide
      slidesData.forEach((slide, index) => {
        const slideNumber = index + 1;
        const shapesWithText = [];
        let shapeOrder = { order: 1 }; // Use object to allow modification in recursive calls
  
        slide.pageElements.forEach((element) => {
          processElement(element, shapesWithText, shapeOrder);
        });
  
        slidesWithText.push({
          slideNumber,
          shapes: shapesWithText, // Store shapes including text boxes and tables
          pageObjectId: slide.objectId,
        });
      });
  
      return slidesWithText;
  
    } catch (error) {
      console.error('Error retrieving slides with text shapes:', error);
      throw error;
    }
  }