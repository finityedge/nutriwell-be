# 🌿 NutriWell E-commerce API

![Node.js](https://img.shields.io/badge/Node.js-16.x+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18+-blue?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-5.x-brightgreen?logo=prisma)
![Passport.js](https://img.shields.io/badge/Passport.js-Auth-red?logo=passport)

Welcome to **NutriWell** 🥗 - A modern, scalable, and robust backend API for your nutrition and wellness e-commerce platform!

## ✨ Features

- 🔐 **Multiple Authentication Methods**
  - Email & Password authentication with bcrypt encryption
  - Google OAuth 2.0 integration via Passport.js
  - JWT token-based authentication
  - Session-based authentication support

- 🗄️ **Database & ORM**
  - PostgreSQL database for reliability and scalability
  - Prisma ORM for type-safe database access
  - Easy migrations and schema management

- 🔒 **Security First**
  - Password hashing with bcryptjs
  - JWT token verification
  - Role-based access control (RBAC)
  - Session management with express-session
  - CORS protection

- 🏗️ **Scalable Architecture**
  - Clean MVC pattern
  - Modular route structure
  - Reusable middleware
  - Environment-based configuration

- ✅ **Data Validation**
  - Request validation with express-validator
  - Custom validation rules
  - Comprehensive error messages

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- 📦 [Node.js](https://nodejs.org/) (v16 or higher)
- 🐘 [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- 📝 A Google Cloud project with OAuth 2.0 credentials (for Google Sign-In)

## 🚀 Quick Start

### 1️⃣ Clone & Install

```bash
# Navigate to project directory
cd nutriwell-be

# Install dependencies
npm install
```

### 2️⃣ Environment Configuration

Copy the example environment file and configure it:

```bash
# Copy the example file
cp .env.example .env
```

Edit the `.env` file with your credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/nutriwell?schema=public"

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Secret (Generate a random string for production)
SESSION_SECRET=your-secret-key-here-change-in-production

# JWT Secret (Generate a random string for production)
JWT_SECRET=your-jwt-secret-key-here-change-in-production

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Client URL (Frontend)
CLIENT_URL=http://localhost:3000
```

### 3️⃣ Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio to view your database
npm run prisma:studio
```

### 4️⃣ Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

You should see:

```
🚀 ========================================
🌿 NutriWell API Server is running
📡 Port: 5000
🌍 Environment: development
🚀 ========================================
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### 🔑 Authentication Endpoints

#### 1. Sign Up (Email & Password)
**POST** `/api/auth/signup`

Register a new user with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt-token"
  }
}
```

---

#### 2. Login (Email & Password)
**POST** `/api/auth/login`

Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "role": "CUSTOMER"
    },
    "token": "jwt-token"
  }
}
```

---

#### 3. Google OAuth Sign In
**GET** `/api/auth/google`

Initiates Google OAuth authentication flow. Redirect users to this endpoint to start Google Sign-In.

**Callback:** `/api/auth/google/callback`

After successful authentication, users will be redirected to your frontend with a token:
```
{CLIENT_URL}/auth/success?token={jwt-token}
```

---

#### 4. Get Profile
**GET** `/api/auth/profile`

Get the current authenticated user's profile.

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "avatar": "https://example.com/avatar.jpg",
      "role": "CUSTOMER",
      "isVerified": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

---

#### 5. Logout
**POST** `/api/auth/logout`

Logout the current user.

**Headers:**
```
Authorization: Bearer {jwt-token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 🏥 Health Check
**GET** `/api/health`

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "NutriWell API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🗂️ Project Structure

```
nutriwell-be/
├── src/
│   ├── config/
│   │   ├── database.js       # Prisma client configuration
│   │   └── passport.js       # Passport.js strategies
│   ├── controllers/
│   │   └── auth.controller.js # Authentication business logic
│   ├── middleware/
│   │   ├── auth.middleware.js # Authentication middleware
│   │   └── validation.middleware.js # Request validation
│   ├── routes/
│   │   ├── auth.routes.js    # Authentication routes
│   │   └── index.js          # Main route aggregator
│   ├── app.js                # Express app configuration
│   └── server.js             # Server entry point
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.example              # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## 🛡️ Security Features

- **Password Hashing**: All passwords are hashed using bcryptjs with salt rounds of 12
- **JWT Tokens**: Secure token-based authentication with 7-day expiration
- **Session Security**: HTTP-only cookies with secure flag in production
- **Input Validation**: Comprehensive validation on all user inputs
- **Role-Based Access Control**: Support for CUSTOMER, ADMIN, and VENDOR roles

## 🔐 Google OAuth Setup

To enable Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5000/api/auth/google/callback` (development)
   - `https://yourdomain.com/api/auth/google/callback` (production)
6. Copy Client ID and Client Secret to your `.env` file

## 🧪 Testing the API

You can test the API using:

- **Postman**: Import the endpoints and test them
- **cURL**: Use command-line curl commands
- **Thunder Client**: VS Code extension for API testing

### Example with cURL:

```bash
# Sign up
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123","username":"testuser"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123"}'
```

## 📖 Swagger API Documentation

The API includes **interactive Swagger documentation** for easy testing!

### Access Swagger UI

Once the server is running, visit:

```
http://localhost:5000/api-docs
```

### Features:

- 🎯 **Interactive Testing**: Test all endpoints directly from your browser
- 📝 **Complete Schemas**: View request/response models
- 🔐 **Authentication**: Add your JWT token to test protected endpoints
- 📋 **Request Examples**: Pre-filled examples for all endpoints

### Using Swagger UI:

1. **Navigate to** `http://localhost:5000/api-docs`
2. **Expand an endpoint** to view details
3. **Click "Try it out"** to enable testing
4. **Fill in parameters** (if required)
5. **Click "Execute"** to make the request
6. **View the response** below

#### For Protected Endpoints:

1. First, login or signup to get a JWT token
2. Click the **Authorize** button at the top of Swagger UI
3. Enter: `Bearer YOUR_JWT_TOKEN` (replace YOUR_JWT_TOKEN)
4. Click **Authorize**
5. Now you can test protected endpoints!

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start the server in production mode |
| `npm run dev` | Start the server in development mode with auto-reload |
| `npm run prisma:generate` | Generate Prisma Client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (Database GUI) |

## 🚀 Adding New Features

The project is structured to be easily extensible. Here's how to add new features:

### Adding a New Model

1. **Update Prisma Schema** (`prisma/schema.prisma`):
```prisma
model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@map("products")
}
```

2. **Run Migration**:
```bash
npm run prisma:migrate
```

### Adding New Routes

1. **Create Controller** (`src/controllers/product.controller.js`)
2. **Create Routes** (`src/routes/product.routes.js`)
3. **Register Routes** in `src/routes/index.js`

Example:
```javascript
// src/routes/index.js
const productRoutes = require('./product.routes');
router.use('/products', productRoutes);
```

## 🌍 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment (development/production) | development |
| `SESSION_SECRET` | Secret for session encryption | - |
| `JWT_SECRET` | Secret for JWT token signing | - |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | - |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL | - |
| `CLIENT_URL` | Frontend application URL | http://localhost:3000 |

## 🐛 Troubleshooting

### Database Connection Issues

**Problem**: `Error: P1001: Can't reach database server`

**Solution**: 
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database credentials

### Google OAuth Not Working

**Problem**: Google Sign-In redirects to error page

**Solution**:
- Verify GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in `.env`
- Check authorized redirect URIs in Google Cloud Console
- Ensure callback URL matches exactly

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution**:
- Change PORT in `.env` file
- Or kill the process using the port

## 🤝 Contributing

This is a starter template ready for your features! Feel free to:

- Add new models (Products, Orders, Categories, etc.)
- Implement payment gateway integration
- Add email verification
- Create admin dashboards
- Implement forgot password functionality
- Add product reviews and ratings
- And much more!

## 📄 License

MIT License - feel free to use this project for your own purposes!

## 💡 Next Steps

Here are some suggested features to implement next:

- [ ] Email verification system
- [ ] Password reset functionality
- [ ] Product management (CRUD)
- [ ] Order management
- [ ] Shopping cart
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Image upload functionality
- [ ] Reviews and ratings
- [ ] Advanced search and filters
- [ ] Admin dashboard
- [ ] Inventory management
- [ ] Shipping integration

---

Made with ❤️ for the NutriWell platform

**Happy Coding! 🚀**
