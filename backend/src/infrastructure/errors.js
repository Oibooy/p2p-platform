
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    Error.captureStackTrace(this, this.constructor);
  }
}

class OrderNotFoundError extends AppError {
  constructor(message = 'Order not found') {
    super(message, 404);
  }
}

class OrderStatusError extends AppError {
  constructor(message = 'Invalid order status transition') {
    super(message, 400);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

module.exports = {
  AppError,
  OrderNotFoundError,
  OrderStatusError,
  ValidationError,
  AuthorizationError,
  ForbiddenError,
  RateLimitError
};
