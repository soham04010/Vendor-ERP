const { eq, and, desc } = require('drizzle-orm');
const { db } = require('../config/db');
const { notifications } = require('../db/schema');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const userNotifications = await db.select()
      .from(notifications)
      .where(eq(notifications.user_id, req.user.id))
      .orderBy(desc(notifications.created_at));

    res.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const [updated] = await db.update(notifications)
      .set({ is_read: true })
      .where(and(eq(notifications.id, id), eq(notifications.user_id, req.user.id)))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Notification not found or access denied' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await db.update(notifications)
      .set({ is_read: true })
      .where(eq(notifications.user_id, req.user.id));

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
