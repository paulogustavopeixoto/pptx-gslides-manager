const download = require('./fileDownloads');
const rgbToHex = require('./rgbToHex');
const filterOriginalSegmentMap = require('./filterOriginalSegmentMap');
const mergeCustomization = require('./mergeCustomization');
const applyUpdatedRunsToSegmentMap = require('./applyUpdatedRunsToSegmentMap');

module.exports = {
    download,
    rgbToHex,
    filterOriginalSegmentMap,
    mergeCustomization,
    applyUpdatedRunsToSegmentMap
}
