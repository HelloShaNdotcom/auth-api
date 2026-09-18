require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs");
const User = require("./models/User");

const {
  validateRegister,
  validateLogin,
  checkValidatorErrors,
} = require("./validators/userValidators");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("./utils/tokenUtils");

const {
  verifyAccessToken,
  requiredAdmin,
  verifyRefreshToken,
} = require("./middleware/auth");

const AppError = require("./utils/errorHandler");

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() =>
    console.log("MongoDB connected successfully"),
)
  .catch((err) =>
    console.error("MongoDB connection failed:", err),
  );

  app.post(
    "/register",
    validateRegister,
    checkValidatorErrors,
    async ( req, res, next) => {
      try {
        const { username, email, password } = req.body;

        if(!username || !email || !password) {
          throw new AppError(
            "username or email and password are required",
            400,
          )
        }
        const existingUser = await User.findOne({
          $or: [{ email }, { username }],
        })

        if(existingUser){
          throw new AppError(
            "username or email already exists",
            409,
          )
        }

        let hashedPassword;

        try{
          hashedPassword = await bcrypt.hash(password, 10);
        }catch(error){
          console.error("password hashing failed:", error);
          throw new AppError(
            "Unable to process the request, Please try again later",
            500,
          )
        }

        const user = new User({
          username,
          email,
          password: hashedPassword,
        })

        await user.save();

        let accessToken;
        let refreshToken;

        try{
          accessToken = generateAccessToken(user._id, user.role);
          refreshToken = generateRefreshToken(user._id);
        }catch(error){
          console.error("Token generation failed:", error);
          throw new AppError(
            "Unable to complete registration. Please try again later",
            500,
          );
        }

        try {
          user.refreshTokens.push({
            token: refreshToken,
          })

          await user.save()

        }catch(error) {
          console.error("Refresh Token save failed:", error)

          throw new AppError(
            "Unable to complete registration. Please try again later",
            500,
          )
        }



        res.status(201).json({
          success:true,
          message: "User registered successfully",
          accessToken,
          refreshToken,
          user:{
            id:user._id,
            username:user.username,
            email:user.email,
            role:user.role,
          }
        })
        }catch (error) {
          next(error)
        }


    }

  )

app.post(
  "/login",
  validateLogin,
  checkValidatorErrors,
  async ( req, res, next) => {
    try {
      const { email, password } = req.body;

      if(!email || !password ) {
        throw new AppError(
          "Email and password are required",
          400,
        )
      }

      const user = await User.findOne({ email });

      if(!user) {
        throw new AppError(
          "Invalid email or password",
          401,
        )
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.password,
      )

      if(!isPasswordValid) {
        throw new AppError(
          "Invalid email or password",
          401,
        )
      }

      let accessToken;
      let refreshToken;

      try {
        accessToken = generateAccessToken( user._id, user.role);
        refreshToken = generateRefreshToken(user._id);
        }catch(error){
          console.error("token generation failed:", error);
          throw new AppError(
            "Unable to complete login. Please try again later",
            500,
          )
        }

        try {
          user.refreshTokens.push({ token: refreshToken });
          await user.save()
        }catch (error) {
          console.error("Refresh token save failed:", error);
          throw new AppError(
            "Unable to complete login. Please try again later",
            500,
          )
        }

        res.status(200).json({
          success:true,
          message: "Login successful",
          accessToken,
          refreshToken,
          user:{
            id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,

          }
        })
    }catch (error) {
      next(error);
    }
  }
)

app.post(
  "/refresh",
  verifyRefreshToken,
  async ( req, res, next) => {
    try {
      const user = await User.findById(req.user.id);

      if(!user) {
        throw new AppError(
          "Unable to refresh access token",
          401,
        )
      }

      const tokenExists = user.refreshTokens.some(
        (rt) => rt.token === req.refreshToken,
      )

      if (!tokenExists) {
        throw new AppError(
          "Refresh token is invalid or has been revoked",
          403,
        )
      }

      let accessToken

      try {
        accessToken = generateAccessToken(user._id, user.role);
      }catch(error) {
        console.error("Access token generation failed:", error)
        throw new AppError(
          "Unable to refresh access token. Please try again later",
          500,
        )
      }

      res.status(200).json({
        success:true,
        message: "Access token refreshed successfully",
        accessToken,
      })
    }catch(error) {
      next(error)
    }
  }
)

app.get(
  "/profile",
  verifyAccessToken,
  async ( req, res, next) => {
    try {
      const user = await User.findById(req.user.id).select(
        "-password -refreshTokens",
      )

      if(!user) {
        throw new AppError(
          "User profile not found",
          404,
        )
      }

      res.status(200).json({
        success:true,
        message: "Profile retrieved successfully",
        user,
      })

    }catch(error) {
    next(error)
  }
  }
)

app.get(
  "/users",
  verifyAccessToken,
  requiredAdmin,
  async ( req, res, next) => {
    try {
      const users = await User.find().select(
        "-password -refreshTokens",
      )

      res.status(200).json({
        success:true,
        message: "Users retrieved successfully",
        users,
      })

    }catch(error) {
      next(error)
    }
  }
)

app.post(
  "/logout",
  verifyRefreshToken,
  async ( req, res, next) => {
    try {
      const user = await User.findById(req.user.id)

      if(!user) {
        throw new AppError(
          "Unable to complete logout",
          401
        )
      }

      user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== req.refreshToken,
      )

      await user.save()

      res.status(200).json({
        success:true,
        message: "Logout successful",
      })
    }catch(error) {
      next(error)
    }
  }
)

app.use((err, req, res, next) => {
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      success:false,
      message: err.message,
    })
  }

  console.error("Unexpected error:", err)

  return res.status(500).json({
    success:false,
    message: "Something went wrong. Please try again later",
  })
}
)


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

