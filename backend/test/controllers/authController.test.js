const request = require('supertest');
const sinon = require('sinon');
const { UserRepository } = require('../../src/db/repositories/UserRepository');
const { sendConfirmationEmail } = require('../../src/core/services/emailService');
const { generateAccessToken, generateRefreshToken } = require('../../src/core/services/tokenService');
const { saveRefreshToken } = require('../../src/core/services/redisService');
const app = require('../../src/api/app'); // Ваше Express-приложение

//Тест 1: Успешная регистрация
describe('POST /register', () => {
  beforeEach(() => {
    sinon.stub(UserRepository, 'findOne').resolves(null);
    sinon.stub(UserRepository.prototype, 'save').resolves({
      _id: '123',
      username: 'testuser',
      email: 'test@example.com',
      isEmailConfirmed: false
    });
    sinon.stub(sendConfirmationEmail).resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should register a new user and send confirmation email', async () => {
    const response = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered. Please confirm your email.');
    expect(sendConfirmationEmail.calledOnce).toBe(true);
  });

  //Регистрация с уже существующим email
  it('should return 400 if email is already in use', async () => {
    sinon.stub(UserRepository, 'findOne').resolves({
      email: 'test@example.com'
    });

    const response = await request(app)
      .post('/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email is already in use.');
  });
});

//Тест 2: Успешный вход
describe('POST /login', () => {
  beforeEach(() => {
    sinon.stub(UserRepository, 'findOne').resolves({
      _id: '123',
      username: 'testuser',
      email: 'test@example.com',
      password: bcrypt.hashSync('password123', 12),
      isActive: true,
      role: { name: 'user' }
    });
    sinon.stub(generateAccessToken).returns('access-token');
    sinon.stub(generateRefreshToken).returns({ refreshToken: 'refresh-token', tokenId: 'token-id' });
    sinon.stub(saveRefreshToken).resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should login user and return tokens', async () => {
    const response = await request(app)
      .post('/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBe('access-token');
    expect(response.body.refreshToken).toBe('refresh-token');
  });

  //Неправильный пароль
  it('should return 401 if password is incorrect', async () => {
    sinon.stub(UserRepository, 'findOne').resolves({
      _id: '123',
      email: 'test@example.com',
      password: bcrypt.hashSync('password123', 12)
    });

    const response = await request(app)
      .post('/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });
});

//Тест 3: Успешный запрос на сброс пароля
describe('POST /forgot-password', () => {
  beforeEach(() => {
    sinon.stub(UserRepository, 'findOne').resolves({
      _id: '123',
      username: 'testuser',
      email: 'test@example.com',
      isActive: true,
      role: { name: 'user' }
    });
    sinon.stub(sendConfirmationEmail).resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should send a password reset email', async () => {
    const response = await request(app)
      .post('/forgot-password')
      .send({
        email: 'test@example.com'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password reset email sent.');
    expect(sendConfirmationEmail.calledOnce).toBe(true);
  });

  //Неправильный email
  it('should return 400 if email is invalid', async () => {
    sinon.stub(UserRepository, 'findOne').resolves(null);

    const response = await request(app)
      .post('/forgot-password')
      .send({
        email: 'invalid@email'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email format');
  });  
});

//Тест 4: Успешный сброс пароля
describe('POST /reset-password/:token', () => {
  beforeEach(() => {
    sinon.stub(UserRepository, 'findOne').resolves({
      _id: '123',
      resetPasswordToken: 'valid-token',
      resetPasswordExpiry: Date.now() + 3600000, // 1 hour
      password: 'old-hashed-password',
      save: sinon.stub().resolves()
    });
    sinon.stub(bcrypt, 'hash').resolves('new-hashed-password');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should reset the password', async () => {
    const response = await request(app)
      .post('/reset-password/valid-token')
      .send({ password: 'newpassword123' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Password has been reset');
  });
  //Неправильный токен
  it('should return 400 if token is invalid or expired', async () => {
    sinon.stub(UserRepository, 'findOne').resolves(null);

    const response = await request(app)
      .post('/reset-password/invalid-token')
      .send({ password: 'newpassword123' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or expired reset token');
  });
});

//Тест 5: Успешный подтверждение электронной почты 
describe('GET /confirm-email/:token', () => {
  beforeEach(() => {
    sinon.stub(jwt, 'verify').returns({ userId: '123' });
    sinon.stub(UserRepository, 'findById').resolves({
      _id: '123',
      isEmailConfirmed: false,
      save: sinon.stub().resolves()
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should confirm the email', async () => {
    const response = await request(app)
      .get('/confirm-email/valid-token');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Email confirmed successfully.');
  });
  
  //Уже подтвержденный email
  it('should return 400 if email is already confirmed', async () => {
    sinon.stub(UserRepository, 'findById').resolves({
      _id: '123',
      isEmailConfirmed: true
    });

    const response = await request(app)
      .get('/confirm-email/valid-token');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email already confirmed.');
  });
});

//Тест 6: Успешная повторная отправка письма
describe('POST /resend-confirmation', () => {
  beforeEach(() => {
    sinon.stub(UserRepository, 'findOne').resolves({
      _id: '123',
      email: 'test@example.com',
      username: 'testuser',
      isEmailConfirmed: false
    });
    sinon.stub(sendConfirmationEmail).resolves();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should resend the confirmation email', async () => {
    const response = await request(app)
      .post('/resend-confirmation')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Confirmation email resent.');
    expect(sendConfirmationEmail.calledOnce).toBe(true);
  });
  // Email уже подтвержден
  it('should return 400 if email is already confirmed', async () => {
    sinon.stub(UserRepository, 'findOne').resolves({
      _id: '123',
      email: 'test@example.com',
      isEmailConfirmed: true
    });

    const response = await request(app)
      .post('/resend-confirmation')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email is already confirmed.');
  });
});

//Тест 7:  Успешное получение данных текущего пользователя
describe('GET /me', () => {
  beforeEach(() => {
    sinon.stub(UserRepository, 'findById').resolves({
      _id: '123',
      username: 'testuser',
      email: 'test@example.com',
      role: { name: 'user' }
    });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return current user data', async () => {
    const response = await request(app)
      .get('/current-user')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('testuser');
    expect(response.body.email).toBe('test@example.com');
    expect(response.body.role.name).toBe('user');
  });
  //Неавторизованный пользователь
  it('should return 404 if user is not found', async () => {
    sinon.stub(UserRepository, 'findById').resolves(null);

    const response = await request(app)
      .get('/me')
      .set('Authorization', 'Bearer valid-token');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found.');
  });
});

//npm test -- --coverage
