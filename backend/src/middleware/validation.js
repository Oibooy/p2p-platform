
const validateAmount = (req, res, next) => {
  const { amount } = req.body;
  
  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({
      error: 'Invalid amount',
      details: 'Amount must be a positive number'
    });
  }
  
  next();
};

module.exports = {
  validateAmount
};
