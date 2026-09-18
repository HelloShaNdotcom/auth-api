const { body, validationResult } = require("express-validator")

const validateRegister = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username should be 3-20 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username must contain only letters, numbers and underscores"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email address is required")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min:8 })
    .withMessage("Password should be a minimum of 8 characters")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least 1 lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least 1 uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least 1 number"),
]

const validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Please provide an email address")
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Please provide a password"),
]

const checkValidatorErrors = (req, res, next) => {
  const errors = validationResult(req)

  if(!errors.isEmpty()){
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    })
  }

  next()
}

module.exports = {
  validateRegister,
  validateLogin,
  checkValidatorErrors,
}
