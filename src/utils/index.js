const download = require('./fileDownloads');
const rgbToHex = require('./rgbToHex');
const filterOriginalSegmentMap = require('./filterOriginalSegmentMap');
const mergeCustomization = require('./mergeCustomization');
const applyUpdatedRunsToSegmentMap = require('./applyUpdatedRunsToSegmentMap');
const preserveParagraphBoundaries = require('./preserveParagraphBoundaries');
const recalcParagraphAndRunIndices = require('./recalcParagraphAndRunIndices');

module.exports = {
    download,
    rgbToHex,
    filterOriginalSegmentMap,
    mergeCustomization,
    applyUpdatedRunsToSegmentMap,
    preserveParagraphBoundaries,
    recalcParagraphAndRunIndices
}
