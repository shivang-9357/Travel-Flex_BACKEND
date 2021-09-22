const multer = require("multer");
const uuid = require("uuid");

const MIME_TYPE_MAP = {
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/jpeg': 'jpeg'
};

const fileUpload = multer({
    limits: 500000,
    storage: multer.diskStorage({
        destination:(req, file, cb)=>{
            cb(null, "uploads/images");
        },
        filename:(req, file, cb)=>{
            cb(null, uuid.v1() + "." + MIME_TYPE_MAP[file.mimetype] )
        }
    }),
    fileFilter: (req, file, cb) => {
        const isValid = !!MIME_TYPE_MAP[file.mimetype];
        let error = isValid? null : new Error("Invalid Mime type.");
        cb(error, isValid);
    }
});

module.exports = fileUpload;