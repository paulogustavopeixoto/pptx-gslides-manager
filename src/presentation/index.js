const upload = require('./uploadPptx');
const generateLink = require('./generateLink');
const duplicate = require('./duplicatePptx');
const getSlides = require('./slidesExtraction');
const generateImage = require('./generateImage');
const deletePptx = require('./deletePptx');


module.exports = {
    upload,
    generateLink,
    duplicate,
    getSlides,
    generateImage,
    deletePptx
}