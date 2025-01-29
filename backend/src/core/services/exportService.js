const json2csv = require("json2csv").parse;
const UserRepository = require("../../db/repositories/UserRepository");
const DealRepository = require("../../db/repositories/DealRepository");

const exportUsers = async () => {
  const users = await UserRepository.find().select("-password");
  const fields = ["username", "email", "role", "isActive", "createdAt"];
  return json2csv(users, { fields });
};

const exportDeals = async () => {
  const deals = await DealRepository.find().populate("buyer seller");
  const fields = ["_id", "amount", "status", "createdAt"];
  return json2csv(deals, { fields });
};

module.exports = { exportUsers, exportDeals };
