import moment from 'moment';
import Sequelize from 'sequelize';
import _ from 'lodash';

import models from '../../model';
import logger from '../logger';

import Graph from './lib/graph';

const Op = Sequelize.Op;

const Distants = {
  Root: 100,
  Follow: 1,
  Post: 2,
  Like: 4,
  Comment: 4,
  LikeComment: 6,
}

class GraphManager {

  constructor() {
    this.g = new Graph();
    this.rootNode = this.g.createNode('root', {name: 'Root Node'});
    this.users = {};
    this.events = {};
    this.posts = {};
    this.relations = {};
    this.likes = {};
    this.comments = {};
  }

  async init() {
    const users = await models.User.findAll({ where: { status: 1 }, raw: true });
    const events = await models.Event.findAll({ where: { status: 0}, raw: true });
    const relations = await models.Relation.findAll({ raw: true });
    const reactions = await models.Reaction.findAll({ raw: true });
    const comments = await models.Comment.findAll({ raw: true });

    users.forEach(user => {
      this.users[user.id] = this.g.createNode('user', user);
      this.g.createEdge('root')
          .link(this.rootNode, this.users[user.id])
          .setDistance(Distants.Root);
    });
    relations.forEach(relation => {
      this.relations[relation.id] = this.g.createEdge('relation', relation)
          .link(this.users[relation.user_id], this.users[relation.follower_id])
          .setDistance(Distants.Follow);
    });

    events.forEach(event => {
      this.events[event.id] = this.g.createNode('event', event);
      this.g.createEdge('root')
          .link(this.rootNode, this.events[event.id])
          .setDistance(Distants.Root);
      this.posts[event.id] = this.g.createEdge('post')
          .link(this.users[event.user_id], this.events[event.id])
          .setDistance(Distants.Post);
    });

    comments.forEach(comment => {
      this.comments[comment.id] = this.g.createEdge('comment', comment)
          .link(this.users[comment.user_id], this.events[comment.relation_id])
          .setDistance(Distants.Comment);
    });
    reactions.forEach(reaction => {
      if (reaction.value == 1) { // calculate only likes
        if (reaction.type == 0) { // like event
          this.likes[reaction.id] = this.g.createEdge('like', reaction)
              .link(this.users[reaction.user_id], this.events[reaction.relation_id])
              .setDistance(Distants.Like);
        } else if (reaction.type == 1) { // like comment
          const comment = this.comments[reaction.relation_id];
          if (comment && this.events[comment.relation_id]) {
            this.likes[reaction.id] = this.g.createEdge('like', reaction)
                .link(this.users[reaction.user_id], this.events[comment.relation_id])
                .setDistance(Distants.LikeComment);
          }
        }
      }
    });
  }

  findEvents(user_id, key, startDate, limit = 20) {
    const entry = this.users[user_id] || this.rootNode;

    key = key && key.toLowerCase();
    const results = this.g.closest(entry, {
      compare: function(node) {
        return node.entity === 'event' && (!key || node.get('title').toLowerCase().indexOf(key) > -1 || node.get('description').toLowerCase().indexOf(key) > -1)
            && (!startDate || moment(node.get('createdAt')) < moment(startDate));
      },
      minDepth: 2,
      count: limit,
    });

    return results.map(result => result.end());
  }


  addUser(user) {
    if (!user || this.users[user.id]) {
      logger.error('graph add User error: ' + (!user)? 'null value of user': 'duplicated user ' + user);
      return;
    }
    this.users[user.id] = this.g.createNode('user', user);
    this.g.createEdge('root')
        .link(this.rootNode, this.users[user.id])
        .setDistance(Distants.Root);
    console.log('graph add user', this.users[user.id])
  }

  followUser(relation) {
    if (!relation) {
      logger.error('graph follow User error: null value of relation');
      return;
    }

    if (!this.relations[relation.id]) {
      this.relations[relation.id] = this.g.createEdge('relation', relation)
    }
    this.relations[relation.id].unlink();
    this.relations[relation.id].link(this.users[relation.user_id], this.users[relation.follower_id])
        .setDistance(Distants.Follow);
    console.log('graph follow user', this.relations[relation.id])
  }

  unfollowUser(relation) {
    if (!relation) {
      logger.error('graph unfollow User error: null value of relation');
      return;
    }

    if (!this.relations[relation.id]) {
      logger.error('graph unfollow User error: ' + 'not existing relation - ' + relation);
      return;
    }

    this.relations[relation.id].unlink();
    delete this.relations[relation.id];
    console.log('graph unfollow user', this.relations[relation.id])
  }

  addEvent(event) {
    if (!event || this.events[event.id]) {
      logger.error('graph add event error: ' + (!event)? 'null value of event': 'duplicated event ' + event);
      return;
    }
    this.events[event.id] = this.g.createNode('event', event);
    this.posts[event.id] = this.g.createEdge('post')
        .link(this.users[event.user_id], this.events[event.id])
        .setDistance(Distants.Post);
    console.log('graph add event', this.events[event.id])
  }

  addLike(reaction) {
    if (!reaction || this.likes[reaction.id]) {
      logger.error('graph add like error: ' + (!reaction)? 'null value of reaction': 'duplicated reaction ' + reaction);
      return;
    }
    if (reaction.value == 1) {
      if (reaction.type == 0) { // like event
        this.likes[reaction.id] = this.g.createEdge('like', reaction)
            .link(this.users[reaction.user_id], this.events[reaction.relation_id])
            .setDistance(Distants.Like);
      } else if (reaction.type == 1) { // like comment
        const comment = this.comments[reaction.relation_id];
        if (comment && this.events[comment.relation_id]) {
          this.likes[reaction.id] = this.g.createEdge('like', reaction)
              .link(this.users[reaction.user_id], this.events[comment.relation_id])
              .setDistance(Distants.LikeComment);
        }
      }
      console.log('graph add like', this.likes[reaction.id])
    }
  }

  updateLike(reaction) {
    if (!reaction) {
      logger.error('graph update like error: null value of reaction');
      return;
    }
    if (reaction.value == 1) { // like
      if (this.likes[reaction.id]) {
        logger.error('graph update like error: duplicated reaction ' + reaction);
        return;
      }
      if (reaction.type == 0) { // like event
        this.likes[reaction.id] = this.g.createEdge('like', reaction)
            .link(this.users[reaction.user_id], this.events[reaction.relation_id])
            .setDistance(Distants.Like);
      } else if (reaction.type == 1) { // like comment
        const comment = this.comments[reaction.relation_id];
        if (comment && this.events[comment.relation_id]) {
          this.likes[reaction.id] = this.g.createEdge('like', reaction)
              .link(this.users[reaction.user_id], this.events[comment.relation_id])
              .setDistance(Distants.LikeComment);
        }
      }
      console.log('graph update like - like:', this.likes[reaction.id])
    } else { // dislike or unlike
      if (this.likes[reaction.id]) {
        this.likes[reaction.id].unlink()
        delete this.likes[reaction.id];
      }
      console.log('graph update like - unlike:', reaction)
    }
  }

  addComment(comment) {
    if (!comment || this.comments[comment.id]) {
      logger.error('graph add comment error: ' + (!comment)? 'null value of comment': 'duplicated comment ' + comment);
      return;
    }
    this.comments[comment.id] = this.g.createEdge('comment', comment)
        .link(this.users[comment.user_id], this.events[comment.relation_id])
        .setDistance(Distants.Comment);
    console.log('graph add comment', comment)
  }

  deleteComment(comment) {
    if (!comment || !this.comments[comment.id]) {
      logger.error('graph delete comment error: ' + (!comment)? 'null value of comment': 'comment isn\'t exist: ' + comment);
      return;
    }
    this.comments[comment.id].unlink()
    delete this.comments[comment.id];
    console.log('graph delete comment', comment)
  }

}

const graph = new GraphManager();

export default graph;