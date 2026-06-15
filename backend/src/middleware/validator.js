import { validationResult } from 'express-validator';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Format error response as { success: false, message: "Error msg" }
    const firstMessage = errors.array()[0].msg;
    return res.status(400).json({
      success: false,
      message: firstMessage
    });
  }
  next();
};
export default validate;
