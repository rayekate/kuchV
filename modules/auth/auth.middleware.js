import jwt from "jsonwebtoken";
import User from "../user/user.model.js";

/**
 * ============================
 * AUTHENTICATE (JWT ACCESS)
 * ============================
 */
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // 1. Check Authorization header
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access token missing"
    });
  }

  // 2. Extract token
  const token = authHeader.split(" ")[1];

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 4. Attach normalized user object
    req.user = {
      userId: decoded.userId || decoded.id,
      customerId: decoded.customerId,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

/**
 * ============================
 * REQUIRE ACTIVE USER
 * ============================
 * Blocks deactivated users
 */
export const requireActiveUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select("isActive");

    if (!user || !user.isActive) {
      return res.status(403).json({
        message: "Account is inactive"
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      message: "Authorization check failed"
    });
  }
};

/**
 * ============================
 * AUTHORIZE SELF OR ADMIN
 * ============================
 */
export const authorizeSelf = (paramName = "userId") => {
  return (req, res, next) => {
    // Admin can access everything
    if (req.user.role === "ADMIN") return next();

    // User can access only own resource
    if (req.user.userId !== req.params[paramName]) {
      return res.status(403).json({
        message: "You can access only your own data"
      });
    }

    next();
  };
};

/**
 * ============================
 * AUTHORIZE ROLES
 * ============================
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    next();
  };
};
