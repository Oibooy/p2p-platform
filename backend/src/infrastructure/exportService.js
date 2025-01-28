
const json2csv = require('json2csv').parse;
const User = require('../models/User');
const Deal = require('../models/Deal');
const Order = require('../models/Order');

const exportUsers = async () => {
  const users = await User.find().select('-password');
  const fields = ['username', 'email', 'role', 'isActive', 'createdAt'];
  return json2csv(users, { fields });
};

const exportDeals = async () => {
  const deals = await Deal.find().populate('buyer seller');
  const fields = ['_id', 'amount', 'status', 'createdAt'];
  return json2csv(deals, { fields });
};

module.exports = { exportUsers, exportDeals };
