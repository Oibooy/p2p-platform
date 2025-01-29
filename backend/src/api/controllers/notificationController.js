const NotificationRepository = require('../../db/repositories/NotificationRepository');
const logger = require('../../infrastructure/logger');
const { AppError } = require('../../infrastructure/errors');

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50, read } = req.query;
    const notificationRepository = new NotificationRepository();
    
    const filter = { user: userId };
    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const [notifications, total] = await Promise.all([
      notificationRepository.findWithPagination(filter, {
        sort: { createdAt: -1 },
        skip: (page - 1) * limit,
        limit: parseInt(limit)
      }),
      notificationRepository.count(filter)
    ]);
    
    res.json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total
      }
    });
  } catch (error) {
    logger.error('Error in getUserNotifications:', error);
    throw new AppError('Failed to fetch notifications', 500);
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notificationRepository = new NotificationRepository();
    const notification = await notificationRepository.findOne({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    const updatedNotification = await notificationRepository.update(
      notificationId,
      { read: true }
    );

    res.json(updatedNotification);
  } catch (error) {
    logger.error('Error in markAsRead:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationRepository = new NotificationRepository();
    
    const result = await notificationRepository.updateMany(
      { user: userId, read: false },
      { read: true }
    );

    logger.info({
      event: 'notifications_marked_read',
      userId,
      count: result.modifiedCount
    });

    res.json({ 
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    logger.error('Error in markAllAsRead:', error);
    throw new AppError('Failed to update notifications', 500);
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notificationRepository = new NotificationRepository();
    const result = await notificationRepository.deleteOne({
      _id: notificationId,
      user: userId
    });

    if (!result) {
      throw new AppError('Notification not found', 404);
    }

    logger.info({
      event: 'notification_deleted',
      notificationId,
      userId
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    throw new AppError(error.message, error.statusCode || 500);
  }
};
