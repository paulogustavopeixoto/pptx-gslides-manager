const download = require('./fileDownloads');
const rgbToHex = require('./rgbToHex');
const processElement = require('./google/processElement');
const extractParagraphsAndRuns = require('./google/extractParagraphsAndRuns');

module.exports = {
    download,
    rgbToHex,
    processElement,
    extractParagraphsAndRuns
}
