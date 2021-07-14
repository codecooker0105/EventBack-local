import { Router } from 'express';
import Joi from '@hapi/joi';
import models from '../../model';
import logger from '../../middleware/logger';
import graph from '../../middleware/graph';

const router = Router();

router.post('/:comment_id', async (req, res) => {
  const { comment_id } = req.params;
  const { relation_id, type, text } = req.body
  const { id, photo, first_name, last_name } = req.user;
  
  const schema = Joi.object().keys({
    relation_id: Joi.number().required(),
    type: Joi.number().required(),
    text: Joi.string().required(),
  });

  try {
    Joi.assert({ relation_id, type, text }, schema, { abortEarly: false });
  } catch (err) {
    const errors = err.details.map(error => ({ message: error.message }))
    return res.status(403).send({
      errors
    });
  }

  try {
    let comment = {};
    if (parseInt(comment_id, 10) === 0) {
      const result = await models.Comment.create({
        user_id: id,
        relation_id, 
        type, 
        text
      })
      comment = result.get({ plain: true });
      graph.addComment(comment);
    } else {
      await models.Comment.update({ text }, { where: { id: comment_id } });
      comment = await models.Comment.findByPk(comment_id);
    }
    let { createdAt, updatedAt } = comment;
    res.status(200).send({
      data: { comment: { id: comment.id, relation_id, type, text, createdAt, updatedAt, user: {id, photo, first_name, last_name} } }
    });
  } catch (err) {
    logger.error('Error on leaving comment:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/delete/:comment_id', async (req, res) => {
  const { comment_id } = req.params;

  try {
    await models.Comment.destroy({ where: { id: comment_id } });
    graph.addComment(comment);
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on deleting comment:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});


export default router;