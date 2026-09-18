# Stage 2: Secure Authentication API

A backend authentication API built with Node.js, Express.js, MongoDB, Mongoose, and JWT.

This project implements user registration, login, access-token authentication, refresh-token validation, protected routes, role-based access control, and logout with refresh-token revocation.

## Features

- User registration with input validation
- Secure password hashing with bcryptjs
- User login with credential verification
- JWT access tokens
- JWT refresh tokens
- Refresh-token storage in MongoDB
- Protected routes using Bearer token authentication
- Role-based access control (RBAC)
- Admin-only user listing
- Refresh-token revocation on logout
- Centralized error handling with a custom `AppError` class
- MongoDB integration with Mongoose

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB
- **ODM:** Mongoose
- **Authentication:** JSON Web Tokens (JWT)
- **Password Hashing:** bcryptjs
- **Validation:** express-validator
- **Environment Variables:** dotenv
- **Deployment:** Render

## Project Structure

```text
stage2-auth-features/
├── middleware/
│   └── auth.js
├── models/
│   └── User.js
├── utils/
│   ├── errorHandler.js
│   └── tokenUtils.js
├── validators/
│   └── userValidators.js
├── .gitignore
├── package.json
├── package-lock.json
└── server.js
```

## Authentication Flow

### Registration

```text
Registration
    ↓
Validate input
    ↓
Check existing user
    ↓
Hash password
    ↓
Save user to MongoDB
    ↓
Generate access + refresh tokens
    ↓
Store refresh token
    ↓
Return authentication response
```

### Login

```text
Login
    ↓
Validate credentials
    ↓
Find user
    ↓
Compare password
    ↓
Generate access + refresh tokens
    ↓
Store refresh token
    ↓
Return authentication response
```

### Protected Request

```text
Protected Request
    ↓
Authorization: Bearer <accessToken>
    ↓
Verify JWT
    ↓
Attach decoded user to req.user
    ↓
Access protected resource
```

## API Endpoints

### 1. Register

**POST `/register`**

Creates a new user account.

#### Request Body

```json
{
  "username": "shan123",
  "email": "shan@example.com",
  "password": "Password123"
}
```

#### Success Response

**Status:** `201 Created`

```json
{
  "success": true,
  "message": "User registered successfully",
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "username": "shan123",
    "email": "shan@example.com",
    "role": "user"
  }
}
```

---

### 2. Login

**POST `/login`**

Authenticates an existing user.

#### Request Body

```json
{
  "email": "shan@example.com",
  "password": "Password123"
}
```

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "...",
  "refreshToken": "...",
  "user": {
    "id": "...",
    "username": "shan123",
    "email": "shan@example.com",
    "role": "user"
  }
}
```

---

### 3. Refresh Access Token

**POST `/refresh`**

Validates a refresh token and generates a new access token.

#### Request Body

```json
{
  "refreshToken": "..."
}
```

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Access token refreshed successfully",
  "accessToken": "..."
}
```

The refresh token must:

1. Be present in the request.
2. Have a valid JWT signature.
3. Not be expired.
4. Exist in the user's stored refresh-token list.

---

### 4. Get Current User Profile

**GET `/profile`**

Returns the authenticated user's profile.

#### Headers

```text
Authorization: Bearer <accessToken>
```

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "user": {
    "_id": "...",
    "username": "shan123",
    "email": "shan@example.com",
    "role": "user",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Passwords and stored refresh tokens are excluded from the response.

---

### 5. Get All Users

**GET `/users`**

Returns all users.

This endpoint requires an authenticated user with the `admin` role.

#### Headers

```text
Authorization: Bearer <adminAccessToken>
```

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "users": []
}
```

Passwords and stored refresh tokens are excluded from the response.

---

### 6. Logout

**POST `/logout`**

Revokes the supplied refresh token for the authenticated user.

#### Request Body

```json
{
  "refreshToken": "..."
}
```

The refresh token is verified and then removed from the user's stored refresh-token list.

#### Success Response

**Status:** `200 OK`

```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Validation

### User Registration

- Username is required
- Username length: 3–20 characters
- Username may contain letters, numbers, and underscores
- Email is required
- Email must be valid
- Password is required
- Password minimum length: 8 characters
- Password must contain at least one lowercase letter
- Password must contain at least one uppercase letter
- Password must contain at least one number

### Login

- Email is required
- Email must be valid
- Password is required

Validation errors return:

**Status:** `400 Bad Request`

## Security

- Passwords are hashed using `bcryptjs`
- Password hashing uses 10 salt rounds
- Access tokens expire after 15 minutes
- Refresh tokens expire after 7 days
- Access tokens use a dedicated JWT secret
- Refresh tokens use a separate JWT secret
- Refresh tokens are stored in MongoDB
- Refresh tokens can be revoked during logout
- Passwords are never returned in profile or user-list responses
- Stored refresh tokens are excluded from profile and user-list responses
- Email and username uniqueness are enforced by the database schema
- Protected routes require a valid access token
- Admin routes require the `admin` role

## Error Handling

The API uses a custom `AppError` class for operational errors.

Examples include:

- Missing required fields
- Duplicate users
- Invalid credentials
- Invalid or expired tokens
- Unauthorized access
- Missing user profiles

Unexpected errors are handled by the centralized Express error-handling middleware.

## Environment Variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_ACCESS_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
PORT=3000
```

Never commit your `.env` file.

The project `.gitignore` excludes:

```text
node_modules/
.env
```

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Create your `.env` file with the required environment variables.

Start the server:

```bash
node server.js
```

The server runs locally on:

```text
http://localhost:3000
```

## Testing

The authentication flow was tested across:

- Valid registration
- Invalid registration input
- Duplicate email handling
- Duplicate username handling
- Valid login
- Invalid login credentials
- Access-token authentication
- Protected route access
- Refresh-token validation
- Access-token renewal
- Invalid/expired token handling
- Admin-only route protection
- Logout and refresh-token revocation
- Full authentication flow

## What I Learned

- JWT authentication architecture
- Access-token and refresh-token patterns
- Password hashing with bcryptjs
- MongoDB data modeling with Mongoose
- Refresh-token storage and revocation
- Role-based access control (RBAC)
- Express middleware chains
- Request validation with express-validator
- Centralized error handling
- Environment-variable management
- Building REST API endpoints
- Testing authentication flows
- Deploying a backend API

## Deployment

The backend was deployed on Render during development.

Production environment variables include:

```text
MONGODB_URI
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
NODE_ENV
```

## Next Steps

- Build React frontend (Stage 3)
- Integrate the authentication API with the frontend
- TypeScript refactor
- Add email verification
- Add two-factor authentication
- Build Project #2: E-commerce system
- Build Project #3: AI-powered document Q&A

## Author

**Shanmuganathan S**

## License

MIT
