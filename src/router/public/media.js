import { Router } from 'express';
import Joi from '@hapi/joi';
import logger from '../../middleware/logger';
import formidable from 'express-formidable';
import uploader from '../../middleware/uploader';

const router = Router();

router.post('/upload', formidable(), async (req, res) => {
  const { file } = req.files;
  
  const schema = Joi.object().keys({
    file: Joi.any().meta({swaggerType: 'file'}).required()
  });
  
  try {
    Joi.assert({ file }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let fileURL = await uploader.uploadFile(file);
    res.status(200).send({
      data: { url: fileURL.Location }
    });
  } catch (err) {
    logger.error('Error on uploading file:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/upload_base64', async (req, res) => {
  const { uri, name } = req.body;
  
  const schema = Joi.object().keys({
    uri: Joi.string().required(),
    name: Joi.string().required(),
  });
  
  try {
    Joi.assert({ uri, name }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let fileURL = await uploader.upload64({uri, name});
    res.status(200).send({
      data: { url: fileURL.Location }
    });
  } catch (err) {
    logger.error('Error on uploading file:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;