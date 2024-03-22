import * as path from 'path';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';

const UPLOAD_DIR = 'uploads';

const storageFile = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename(req, file, fn) {
    fn(
      null,
      `${new Date().getTime().toString()}-${file.fieldname}${path.extname(
        file.originalname
      )}`
    );
  },
});

const uploadFile = multer({
  storage: storageFile,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    const extension =
      ['.xlsx'].indexOf(path.extname(file.originalname).toLowerCase()) >= 0;
    const mimeType =
      [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ].indexOf(file.mimetype) >= 0;

    if (extension && mimeType) {
      return callback(null, true);
    }

    callback(new Error('Invalid file type'));
  },
}).single('file');

/**
 * This function handles the upload of a single file.
 * References: https://medium.com/@tericcabrel/upload-files-to-the-node-js-server-with-express-and-multer-3c41f41a6e
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const handleSingleUploadFile = (req, res, next) => {
  if (!existsSync(UPLOAD_DIR)) {
    mkdirSync(UPLOAD_DIR);
  }

  return new Promise((resolve, reject) => {
    uploadFile(req, res, (error) => {
      if (error) {
        reject(error);
      }

      req.body.file = req.file;

      resolve({ file: req.file, body: req.body });
      next();
    });
  });
};

export { handleSingleUploadFile };
