const mongoose = require('mongoose');
const DisputeService = require('../../core/services/disputeService');
const { validateDispute } = require('../validators/disputeValidator');

exports.getAllDisputes = async (req, res, next) => {
  try {
    const disputes = await DisputeService.getAllDisputes();
    res.status(200).json({ success: true, data: disputes });
  } catch (error) {
    next(error);
  }
};

// Создание нового спора
exports.createDispute = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderId, reason, evidence } = req.body;
    const userId = req.user.id;

    const disputeService = new DisputeService();
    const dispute = await disputeService.createDispute(
      orderId, 
      userId, 
      reason, 
      evidence,
      session
    );

    await session.commitTransaction();
    res.status(201).json({ success: true, data: dispute });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Разрешение спора
exports.resolveDispute = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { resolution, comment } = req.body;
    const moderatorId = req.user.id;

    const disputeService = new DisputeService();
    const dispute = await disputeService.resolveDispute(
      id,
      moderatorId,
      resolution,
      comment,
      session
    );

    await session.commitTransaction();
    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// Получение деталей спора
exports.getDisputeDetails = async (req, res, next) => {
  try {
    const disputeRepository = new DisputeRepository();
    const dispute = await disputeRepository.findByIdWithDetails(req.params.id);

    if (!dispute) {
      return next(new AppError('Спор не найден', 404));
    }

    res.status(200).json({ success: true, data: dispute });
  } catch (error) {
    next(error);
  }
};