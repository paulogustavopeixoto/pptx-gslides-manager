const uploadPresentation = require('./uploadPresentation');
const generateLink = require('./generateLink');
const duplicatePresentation = require('./duplicatePresentation');
const getSlides = require('./slidesExtraction');
const generateSlideImage = require('./generateSlideImage');
const deletePresentation = require('./deletePresentation');


module.exports = {
    upload: uploadPresentation,
    getLink: generateLink,
    duplicate: duplicatePresentation,
    getSlides: getSlides,
    getSlideImage: generateSlideImage,
    delete: deletePresentation
}