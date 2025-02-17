const uploadPresentation = require('./uploadPresentation');
const generateLink = require('./generateLink');
const duplicatePresentation = require('./duplicatePresentation');
const getSlides = require('./slidesExtraction');
const generateSlideImage = require('./generateSlideImage');
const deletePresentation = require('./deletePresentation');
const getPresentationText = require('./getPresentationText');
const batchUpdateSlidesText = require('./batchUpdateSlides');
const getPresentation = require('./getPresentation');
const deleteSlide = require('./deleteSlide');


module.exports = {
    upload: uploadPresentation,
    getLink: generateLink,
    duplicate: duplicatePresentation,
    getSlides: getSlides,
    getSlideImage: generateSlideImage,
    delete: deletePresentation,
    getPresentationText,
    batchUpdate: batchUpdateSlidesText,
    getPresentation,
    deleteSlide
}