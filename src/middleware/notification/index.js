import * as admin from 'firebase-admin';
import config from '../../config';
import models from '../../model';
var serviceAccount = require("../../../firebase_key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.firebase_url
});

class NotificationManager {
  async sendNotification(tokens, title, body) {
    await admin.messaging().sendMulticast({
      tokens: tokens,
      notification: { title, body },
    });
  }

  async sendFollowNotification(user_id, follower_name, flag = 0) {
    const title = "Follow";
    const content = follower_name + (flag === 0 ? ' starts ' : ' no longer ') + 'following you';
    await models.Notification.create({ user_id, title, content, read: 0});
    const tokenCheck = await models.NotificationToken.findOne({ where: { user_id } });
    if (tokenCheck) {
      this.sendNotification([tokenCheck.token], title, content)
    }
  }

  async sendEventCreateNotification(user_id, creator_name, event_title) {
    const followers = await models.Relation.findAll({
      nest: false,
      raw: true,
      where: { user_id },
      attributes: ['id'],
      include: [{
        model: models.User,
        as: 'follower',
        attributes: ['id'],
        required: true,
        include: [{
          model: models.NotificationToken,
          as: 'my_notification_token',
          attributes: ['token'],
          required: true,
        }]
      }]
    })
    if (followers.length === 0) return;

    const title = "Event";
    const content = `${creator_name} just created new event "${event_title}"`;

    let createDBData = [];
    let tokens = [];
    for (let item of followers) {
      createDBData.push({
        user_id: item["follower.id"],
        title,
        content,
        read: 0
      })
      tokens.push(item["follower.my_notification_token.token"])
    }
    await models.Notification.bulkCreate(createDBData);
    this.sendNotification(tokens, title, content);
  }
}

const instance = new NotificationManager();
export default instance;