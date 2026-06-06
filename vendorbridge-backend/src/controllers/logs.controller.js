const { desc, eq } = require('drizzle-orm');
const { db } = require('../config/db');
const { activity_logs, users } = require('../db/schema');

exports.getLogs = async (req, res) => {
  try {
    const logs = await db.select({
      id: activity_logs.id,
      action: activity_logs.action,
      entity_type: activity_logs.entity_type,
      entity_id: activity_logs.entity_id,
      description: activity_logs.description,
      metadata: activity_logs.metadata,
      created_at: activity_logs.created_at,
      user: {
        name: users.name,
        email: users.email,
        role: users.role
      }
    })
    .from(activity_logs)
    .leftJoin(users, eq(activity_logs.user_id, users.id))
    .orderBy(desc(activity_logs.created_at))
    .limit(100);

    res.json(logs);
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
