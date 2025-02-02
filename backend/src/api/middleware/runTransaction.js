const mongoose = require('mongoose');
const logger = require('../services/loggingService');
const metrics = require('../services/metricsService');

const runTransaction = async (operations) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await operations(session);
        await session.commitTransaction();
        session.endSession();
        metrics.increment('transaction.success');
        return result;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        logger.logError(`Transaction error: ${error.message}`);
        metrics.increment('transaction.failure');
        throw error;
    }
};

module.exports = runTransaction;