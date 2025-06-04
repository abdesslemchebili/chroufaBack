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
    body('email', 'Please include a valid email').isEmail(),
    body('password', 'Password must be at least 8 characters').isLength({ min: 8 }),
    body('consentGiven', 'Consent must be explicitly given as true or false').isBoolean()
  ];
};

// Pool validation rules
exports.poolValidationRules = () => {
  return [
    body('userId', 'User ID is required').notEmpty(),
    body('name', 'Pool name is required').notEmpty(),
    body('address.street', 'Street address is required').notEmpty(),
    body('address.city', 'City is required').notEmpty(),
    body('address.state', 'State is required').notEmpty(),
    body('address.zipCode', 'Zip code is required').notEmpty(),
    body('specifications.type', 'Pool type must be residential, commercial, or public')
      .isIn(['residential', 'commercial', 'public']),
    body('specifications.volume.value', 'Volume value must be a positive number')
      .isFloat({ min: 0 }),
    body('specifications.volume.unit', 'Volume unit must be gallons or liters')
      .optional()
      .isIn(['gallons', 'liters']),
    body('specifications.surfaceArea.value', 'Surface area value must be a positive number')
      .isFloat({ min: 0 }),
    body('specifications.surfaceArea.unit', 'Surface area unit must be sqft or sqm')
      .optional()
      .isIn(['sqft', 'sqm']),
    body('equipment.*.type', 'Equipment type must be valid')
      .optional()
      .isIn(['pump', 'filter', 'heater', 'chlorinator', 'other']),
    body('equipment.*.name', 'Equipment name is required when equipment is provided')
      .optional()
      .notEmpty(),
    body('status', 'Status must be active, inactive, or maintenance')
      .optional()
      .isIn(['active', 'inactive', 'maintenance'])
  ];
};

// Pool equipment validation rules
exports.equipmentValidationRules = () => {
  return [
    body('equipment', 'Equipment array is required').isArray(),
    body('equipment.*.type', 'Equipment type must be valid')
      .isIn(['pump', 'filter', 'heater', 'chlorinator', 'other']),
    body('equipment.*.name', 'Equipment name is required').notEmpty(),
    body('equipment.*.model').optional(),
    body('equipment.*.serialNumber').optional(),
    body('equipment.*.installationDate', 'Installation date must be a valid date')
      .optional()
      .isISO8601(),
    body('equipment.*.lastServiceDate', 'Last service date must be a valid date')
      .optional()
      .isISO8601()
  ];
};

// Chemical levels validation rules
exports.chemicalLevelsValidationRules = () => {
  return [
    body('idealRanges.chlorine.min', 'Chlorine minimum must be a number between 0 and 10')
      .isFloat({ min: 0, max: 10 }),
    body('idealRanges.chlorine.max', 'Chlorine maximum must be a number between 0 and 10')
      .isFloat({ min: 0, max: 10 }),
    body('idealRanges.pH.min', 'pH minimum must be a number between 6.8 and 8.0')
      .isFloat({ min: 6.8, max: 8.0 }),
    body('idealRanges.pH.max', 'pH maximum must be a number between 6.8 and 8.0')
      .isFloat({ min: 6.8, max: 8.0 }),
    body('idealRanges.alkalinity.min', 'Alkalinity minimum must be a number between 0 and 240')
      .isFloat({ min: 0, max: 240 }),
    body('idealRanges.alkalinity.max', 'Alkalinity maximum must be a number between 0 and 240')
      .isFloat({ min: 0, max: 240 })
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