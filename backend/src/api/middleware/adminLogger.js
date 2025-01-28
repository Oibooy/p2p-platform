const AdminLog = require('../../db/models/AdminLog');

const adminLogger = async (req, res, next) => {
  const originalJson = res.json;
  res.json = async function(data) {
    try {
      await AdminLog.create({
        admin: req.user._id,
        action: `${req.method} ${req.path}`,
        details: {
          params: req.params,
          query: req.query,
          body: req.body,
          response: data
        }
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
    return originalJson.call(this, data);
  };
  next();
};

module.exports = adminLogger;
