const { db } = require('../config/db');
const { activity_logs } = require('../db/schema');

exports.createLog = async ({ userId, action, entityType, entityId, description, metadata }) => {
  try {
    const [log] = await db.insert(activity_logs).values({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      description,
      metadata: metadata || null
    }).returning();
    return log;
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
};
