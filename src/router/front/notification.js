import { Router } from 'express';
import models from '../../model';
import logger from '../../middleware/logger';

const router = Router();

router.get('/', async (req, res) => {
  const { id } = req.user;

  try {
    const notifications = await models.Notification.findAll({
			nest: true,
      raw: false,
      where: {
        user_id: id
      },
      order: [ ['id', 'DESC'], ],
		})
		res.status(200).send({
			data: notifications
		});
  } catch (err) {
    logger.error('Error on getting notifications:', err);
    res.status(500).send({
      errors: [err]
    });
  }
})

router.post('/read/:notification_id', async (req, res) => {
  const { notification_id } = req.params;

  try {
    await models.Notification.update({ read: 1 }, { where: { id: parseInt(notification_id, 10)}})
		res.status(200).send({
			data: { msg: 'success' }
		});
  } catch (err) {
    logger.error('Error on reading notification:', err);
    res.status(500).send({
      errors: [err]
    });
  }
})

router.post('/token', async (req, res) => {
  const { id } = req.user;
  const { token } = req.body;

  try {
    const tokenCheck = await models.NotificationToken.findOne({ where: {user_id: id}});
    if (!tokenCheck) {
      await models.NotificationToken.create({ user_id: id, token })
    } else {
      await models.NotificationToken.update({ token }, { where: {id: tokenCheck.id}})
    }
    res.status(200).send({
      data: { msg: 'success' }
    });
  } catch (err) {
    logger.error('Error on updating notification token:', err);
    res.status(500).send({
      errors: [err]
    });
  }
});

export default router;