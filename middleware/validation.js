const { body, validationResult } = require('express-validator');

// Validation middleware
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
exports.userValidationRules = () => {
  return [
    body('name', 'Name is required').notEmpty(),
    body('username', 'Username is required')
      .notEmpty()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email', 'Please include a valid email')
      .optional()
      .isEmail(),
    body('password', 'Password is required').notEmpty(),
    body('consentGiven', 'Consent must be explicitly given as true or false').isBoolean()
  ];
};

// Pool validation rules (simplified)
exports.poolValidationRules = () => {
  return [
    body('name', 'Pool name is required').notEmpty().trim(),
    body('address', 'Street address is required').notEmpty().trim(),
    body('owner', 'Pool owner is required').notEmpty().isMongoId(),
    body('type', 'Pool type must be residential, commercial, or public')
      .isIn(['residential', 'commercial', 'public']),
    // Optional fields
    body('size.value', 'Size value must be a positive number')
      .optional()
      .isFloat({ min: 0 }),
    body('size.unit', 'Size unit must be sqft or sqm')
      .optional()
      .isIn(['sqft', 'sqm']),
    body('volume.value', 'Volume value must be a positive number')
      .optional()
      .isFloat({ min: 0 }),
    body('volume.unit', 'Volume unit must be gallons or liters')
      .optional()
      .isIn(['gallons', 'liters']),
    body('status', 'Status must be active, inactive, or maintenance')
      .optional()
      .isIn(['active', 'inactive', 'maintenance']),
    body('notes', 'Notes must be a string')
      .optional()
      .isString()
  ];
};

// Task validation rules
exports.taskValidationRules = () => {
  return [
    body('title', 'Title is required').notEmpty(),
    body('poolId', 'Pool ID is required').notEmpty(),
    body('scheduledDate', 'Scheduled date is required').notEmpty(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('recurrence').optional().isIn(['none', 'daily', 'weekly', 'biweekly', 'monthly'])
  ];
};

// Record validation rules
exports.recordValidationRules = () => {
  return [
    body('poolId', 'Pool ID is required').notEmpty(),
    body('type', 'Type is required').isIn(['chemical', 'cleaning', 'repair', 'inspection', 'other']),
    body('description', 'Description is required').notEmpty(),
    body('measurements.chlorine').optional().isNumeric(),
    body('measurements.pH').optional().isNumeric(),
    body('measurements.alkalinity').optional().isNumeric(),
    body('measurements.temperature').optional().isNumeric(),
    body('productsUsed.*.name').optional().notEmpty(),
    body('productsUsed.*.quantity').optional().isNumeric(),
    body('productsUsed.*.unit').optional().notEmpty()
  ];
};

// Troubleshooting guide validation rules
exports.guideValidationRules = () => {
  return [
    body('title', 'Title is required').notEmpty(),
    body('description', 'Description is required').notEmpty(),
    body('category', 'Category is required').isIn(['water-quality', 'equipment', 'cleaning', 'general']),
    body('steps', 'At least one step is required').isArray({ min: 1 }),
    body('steps.*.order', 'Step order is required').isNumeric(),
    body('steps.*.title', 'Step title is required').notEmpty(),
    body('steps.*.description', 'Step description is required').notEmpty()
  ];
};

// Password change validation rules
exports.passwordChangeValidationRules = () => {
  return [
    body('currentPassword', 'Current password is required').notEmpty(),
    body('newPassword', 'New password is required').notEmpty()
  ];
};