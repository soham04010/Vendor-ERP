const { db } = require('../config/db');
const { notifications } = require('../db/schema');

exports.createNotification = async ({ userId, title, message, type, entityId }) => {
  try {
    const [notification] = await db.insert(notifications).values({
      user_id: userId,
      title,
      message,
      type,
      entity_id: entityId,
      is_read: false
    }).returning();
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};
