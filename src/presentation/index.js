const upload = require('./uploadPptx');
const generateLink = require('./generateLink');
const duplicate = require('./duplicatePptx');
const getSlides = require('./slidesExtraction');


module.exports = {
    upload,
    generateLink,
    duplicate,
    getSlides
}