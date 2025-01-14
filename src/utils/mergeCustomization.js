/**
 * mergeCustomization()
 *
 * Adds a "customization" key to each entry in runsOnlyMap 
 * based on the corresponding shape's "customization" value 
 * in the parsedShapes array (matching by shapeId).
 *
 * @param {object} runsOnlyMap - The object of shapes keyed by shapeId, e.g.:
 *   {
 *     "p9_i274": {
 *       type: "text",
 *       runs: [ { id: "run-0", text: "...", ... }, ... ]
 *     },
 *     "p9_i275": {
 *       type: "text",
 *       runs: ...
 *     },
 *     ...
 *   }
 *
 * @param {array} parsedShapes - Array of shape objects, each having:
 *   {
        bold: false,
        italic: false,
        characterCount: 70,
        'Modified Date': '2024-12-27T15:16:42.867Z',
        'Created Date': '2024-12-27T15:16:42.866Z',
        'Created By': '1727264012814x387975427566664900',
        customization: 'CUSTOM',
        exampleContent: '2024 Moomoo x GOLDCOMM / CONFIDENTIAL [Not for external distribution]\n',
        order: 4,
        outputPage: '1735312600559x250112559630041100',
        shapeId: 'p11_i528',
        type: 'text',
        originalContent: '2024 Moomoo x GOLDCOMM / CONFIDENTIAL [Not for external distribution]\n',
        _id: '1735312602861x307144466170893500'
      }
 *
 * @returns {object} The updated runsOnlyMap with "customization" inserted.
 */
function mergeCustomization(runsOnlyMap, parsedShapes) {
    // We can mutate the existing runsOnlyMap or clone it if you want immutability.
    // For simplicity, we'll mutate in-place here.

    parsedShapes.forEach(shape => {
        const { shapeId, customization, characterCount } = shape;

        // Only proceed if runsOnlyMap has a matching entry
        if (runsOnlyMap[shapeId]) {
        runsOnlyMap[shapeId].customization = customization;
        runsOnlyMap[shapeId].characterCount = characterCount;
        }
    });

    return runsOnlyMap;
}

module.exports = mergeCustomization;