'use strict';

const mongoose  = require('mongoose'),
      BaseModel = require("./base_model");

const Schema    = mongoose.Schema,
      ObjectId  = Schema.ObjectId;

/**
 * 收藏的话题
 */
const TopicCollectSchema = new Schema({
  user_id: { type: ObjectId },
  topic_id: { type: ObjectId },
  create_at: { type: Date, default: Date.now }
});

TopicCollectSchema.plugin(BaseModel);
TopicCollectSchema.index({ user_id: 1, topic_id: 1 }, { unique: true });

mongoose.model('TopicCollect', TopicCollectSchema);
