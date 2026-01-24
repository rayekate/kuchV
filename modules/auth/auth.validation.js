import { body, param, query, validationResult } from "express-validator";

export const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  next();
};

export const registerValidation = [
    body("name")
      .trim()
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),

    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email format")
      .normalizeEmail(),
  
    body("password")
      .notEmpty().withMessage("Password is required")
      .isLength({ min: 8 }).withMessage("Password must be at least 8 characters")
      .matches(/[A-Z]/).withMessage("Password must contain one uppercase letter")
      .matches(/[a-z]/).withMessage("Password must contain one lowercase letter")
      .matches(/[0-9]/).withMessage("Password must contain one number")
      .matches(/[!@#$%^&*]/).withMessage("Password must contain one special character"),
  
    body("role")
      .optional()
      .isIn(["USER", "ADMIN"])
      .withMessage("Invalid role"),
  
    validate
  ];

  export const loginValidation = [
    body("email")
      .trim()
      .notEmpty().withMessage("Email is required")
      .isEmail().withMessage("Invalid email"),
  
    body("password")
      .notEmpty().withMessage("Password is required"),
  
    validate
  ];
  