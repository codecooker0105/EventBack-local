import { Router } from 'express';
import models from '../../model';
import logger from '../../middleware/logger';
import graph from '../../middleware/graph';
import notificationManager from '../../middleware/notification';

const router = Router();

const getMyRelation = async (id) => {
  const followers = await models.Relation.findAll({
    nest: true,
    raw: false,
    where: { user_id: id },
    attributes: ['createdAt', 'updatedAt'],
    include: [{
      model: models.User,
      as: 'follower',
      attributes: ['id', 'first_name', 'last_name', 'photo']
    }]
  })
  const following = await models.Relation.findAll({
    nest: true,
    raw: false,
    where: { follower_id: id },
    attributes: ['createdAt', 'updatedAt'],
    include: [{
      model: models.User,
      as: 'user_info',
      attributes: ['id', 'first_name', 'last_name', 'photo']
    }]
  })
  return { followers, following };
}

router.get('/', async (req, res) => {
  const { id } = req.user;

  try {
    const infos = await getMyRelation(id);
    const { followers, following } = infos;
    res.status(200).send({
      data: { followers, following }
    });
  } catch (err) {
    logger.error('Error on getting relation:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

router.post('/follow/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { id, first_name, last_name } = req.user;

  try {
    let relation = await models.Relation.findOne({
      where: {
        user_id: parseInt(user_id, 10),
        follower_id: id
      }
    })

    let flag = 0;
    if (relation) {
      flag = 1;
      await models.Relation.destroy({ where: {id: relation.id} })
      graph.unfollowUser(relation.get({ plain: true }));
    } else {
      relation = await models.Relation.create({ user_id: parseInt(user_id, 10), follower_id: id })
      graph.followUser(relation.get({ plain: true }));
    }
    notificationManager.sendFollowNotification(user_id, `${first_name} ${last_name}`, flag)
    const infos = await getMyRelation(id);
    const { followers, following } = infos;
    res.status(200).send({
      data: { followers, following }
    });
  } catch (err) {
    logger.error('Error on following:', err);
    res.status(500).send({
      errors: [err]
    });
  }
})

export default router;