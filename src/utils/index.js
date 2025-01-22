const download = require('./fileDownloads');
const rgbToHex = require('./rgbToHex');
const filterOriginalSegmentMap = require('./filterOriginalSegmentMap');
const mergeCustomization = require('./mergeCustomization');
const applyUpdatedRunsToSegmentMap = require('./applyUpdatedRunsToSegmentMap');
const preserveParagraphBoundaries = require('./preserveParagraphBoundaries');
const recalcParagraphAndRunIndices = require('./recalcParagraphAndRunIndices');
const reapplyFormattingByID = require('./reapplyFormatting');


module.exports = {
    download,
    rgbToHex,
    filterOriginalSegmentMap,
    mergeCustomization,
    applyUpdatedRunsToSegmentMap,
    preserveParagraphBoundaries,
    recalcParagraphAndRunIndices,
    reapplyFormattingByID
}
