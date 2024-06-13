import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../../utils/logger.js';
import __dirname from '../../utils/utils.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        logger.info("MIDDLEWAREEE")
        let folder = '';

        switch (file.fieldname) {
            case 'identificacion':
                folder = 'public/documents/identificacion';
                break;
            case 'comprobante_de_domicilio':
                folder = 'public/documents/comprobante-de-domicilio';
                break;
            case 'comprobante_de_estado_de_cuenta':
                folder = 'public/documents/comprobante-de-estado-de-cuenta';
                break;
            default:
                folder = 'public/documents/otros';
                break;
        }

        fs.mkdirSync(path.join(__dirname, '../../', folder), { recursive: true });

        cb(null, path.join(__dirname, '../../', folder));
    },
    filename: (req, file, cb) => {
        const email = req.session.user.email;
        const type = file.fieldname.replace(/_/g, '-');
        const filename = `${email}-${type}.pdf`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Only PDF files are allowed!'));
    }
}).fields([
    { name: 'identificacion', maxCount: 1 },
    { name: 'comprobante_de_domicilio', maxCount: 1 },
    { name: 'comprobante_de_estado_de_cuenta', maxCount: 1 }
]);

export default upload;
