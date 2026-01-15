/**
 * Validation utility for form fields and data integrity
 */

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Validation rules
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  email?: boolean;
  url?: boolean;
  numeric?: boolean;
  integer?: boolean;
  positive?: boolean;
  future?: boolean;
  past?: boolean;
  unique?: (value: any) => boolean;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  ETH_ADDRESS: /^0x[a-fA-F0-9]{40}$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_SPACES: /^[a-zA-Z0-9\s]+$/,
  DECIMAL: /^\d+(\.\d+)?$/,
  INTEGER: /^\d+$/,
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^\d{2}:\d{2}$/,
  DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
} as const;

// Validation error messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
  PATTERN: 'Invalid format',
  EMAIL: 'Please enter a valid email address',
  URL: 'Please enter a valid URL',
  ETH_ADDRESS: 'Please enter a valid Ethereum address',
  PHONE: 'Please enter a valid phone number',
  PASSWORD: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
  ALPHANUMERIC: 'Only letters and numbers are allowed',
  ALPHANUMERIC_WITH_SPACES: 'Only letters, numbers, and spaces are allowed',
  DECIMAL: 'Please enter a valid decimal number',
  INTEGER: 'Please enter a valid integer',
  DATE: 'Please enter a valid date',
  TIME: 'Please enter a valid time',
  DATETIME: 'Please enter a valid date and time',
  NUMERIC: 'Please enter a valid number',
  POSITIVE: 'Please enter a positive number',
  FUTURE: 'Date must be in the future',
  PAST: 'Date must be in the past',
  UNIQUE: 'This value must be unique',
  CUSTOM: 'Invalid value',
} as const;

/**
 * Main validation function
 */
export const validate = (
  value: any,
  rules: ValidationRule,
  fieldName: string = 'field'
): ValidationResult => {
  const errors: ValidationError[] = [];

  // Handle null/undefined values
  if (value === null || value === undefined) {
    if (rules.required) {
      errors.push({
        field: fieldName,
        message: VALIDATION_MESSAGES.REQUIRED,
        code: 'REQUIRED',
      });
    }
    return { isValid: errors.length === 0, errors };
  }

  // Convert to string for length checks
  const stringValue = String(value).trim();

  // Required check
  if (rules.required && stringValue === '') {
    errors.push({
      field: fieldName,
      message: VALIDATION_MESSAGES.REQUIRED,
      code: 'REQUIRED',
    });
  }

  // Skip other validations if empty and not required
  if (stringValue === '' && !rules.required) {
    return { isValid: errors.length === 0, errors };
  }

  // Length validations
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push({
      field: fieldName,
      message: VALIDATION_MESSAGES.MIN_LENGTH(rules.minLength),
      code: 'MIN_LENGTH',
    });
  }

  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push({
      field: fieldName,
      message: VALIDATION_MESSAGES.MAX_LENGTH(rules.maxLength),
      code: 'MAX_LENGTH',
    });
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push({
      field: fieldName,
      message: VALIDATION_MESSAGES.PATTERN,
      code: 'PATTERN',
    });
  }

  // Email validation
  if (rules.email && !VALIDATION_PATTERNS.EMAIL.test(stringValue)) {
    errors.push({
      field: fieldName,
      message: VALIDATION_MESSAGES.EMAIL,
      code: 'EMAIL',
    });
  }

  // URL validation
  if (rules.url && !VALIDATION_PATTERNS.URL.test(stringValue)) {
    errors.push({
      field: fieldName,
      message: VALIDATION_MESSAGES.URL,
      code: 'URL',
    });
  }

  // Numeric validation
  if (rules.numeric) {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      errors.push({
        field: fieldName,
        message: VALIDATION_MESSAGES.NUMERIC,
        code: 'NUMERIC',
      });
    } else if (rules.positive && numValue <= 0) {
      errors.push({
        field: fieldName,
        message: VALIDATION_MESSAGES.POSITIVE,
        code: 'POSITIVE',
      });
    }
  }

  // Integer validation
  if (rules.integer) {
    const numValue = Number(value);
    if (isNaN(numValue) || !Number.isInteger(numValue)) {
      errors.push({
        field: fieldName,
        message: VALIDATION_MESSAGES.INTEGER,
        code: 'INTEGER',
      });
    }
  }

  // Date validations
  if (rules.future || rules.past) {
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) {
      errors.push({
        field: fieldName,
        message: VALIDATION_MESSAGES.DATE,
        code: 'DATE',
      });
    } else {
      const now = new Date();
      if (rules.future && dateValue <= now) {
        errors.push({
          field: fieldName,
          message: VALIDATION_MESSAGES.FUTURE,
          code: 'FUTURE',
        });
      }
      if (rules.past && dateValue >= now) {
        errors.push({
          field: fieldName,
          message: VALIDATION_MESSAGES.PAST,
          code: 'PAST',
        });
      }
    }
  }

  // Unique validation
  if (rules.unique && !rules.unique(value)) {
    errors.push({
      field: fieldName,
      message: VALIDATION_MESSAGES.UNIQUE,
      code: 'UNIQUE',
    });
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(value);
    if (customResult !== true) {
      errors.push({
        field: fieldName,
        message: typeof customResult === 'string' ? customResult : VALIDATION_MESSAGES.CUSTOM,
        code: 'CUSTOM',
      });
    }
  }

  return { isValid: errors.length === 0, errors };
};

/**
 * Validate multiple fields at once
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult => {
  const allErrors: ValidationError[] = [];

  Object.keys(rules).forEach(fieldName => {
    const fieldRules = rules[fieldName];
    const fieldValue = data[fieldName];
    const result = validate(fieldValue, fieldRules, fieldName);
    allErrors.push(...result.errors);
  });

  return { isValid: allErrors.length === 0, errors: allErrors };
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove all HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    // Remove data: protocol
    .replace(/data:text\/html/gi, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ');
};

/**
 * Sanitize HTML content
 */
export const sanitizeHtml = (html: string): string => {
  const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'];
  const allowedAttributes = ['class', 'id'];
  
  // Simple HTML sanitization - in production, use a library like DOMPurify
  let sanitized = html;
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  
  // Remove object tags
  sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  
  // Remove embed tags
  sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized;
};

/**
 * Validate Ethereum address
 */
export const validateEthAddress = (address: string): boolean => {
  if (!VALIDATION_PATTERNS.ETH_ADDRESS.test(address)) {
    return false;
  }
  
  // Additional checks for mixed case addresses (EIP-55)
  if (address !== address.toLowerCase() && address !== address.toUpperCase()) {
    // This is a simplified check - in production, use a library like ethers.js
    return true;
  }
  
  return true;
};

/**
 * Validate and format Ethereum address
 */
export const formatEthAddress = (address: string): string => {
  if (!validateEthAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }
  
  return address.toLowerCase();
};

/**
 * Validate letter content
 */
export const validateLetterContent = (content: string): ValidationResult => {
  return validate(content, {
    required: true,
    minLength: 10,
    maxLength: 10000,
    custom: (value) => {
      const sanitized = sanitizeInput(value);
      if (sanitized.length < 10) {
        return 'Letter content must be at least 10 characters long';
      }
      return true;
    },
  }, 'content');
};

/**
 * Validate unlock date
 */
export const validateUnlockDate = (date: string | Date): ValidationResult => {
  const dateValue = typeof date === 'string' ? new Date(date) : date;
  
  return validate(dateValue, {
    required: true,
    future: true,
    custom: (value) => {
      const now = new Date();
      const minDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const maxDate = new Date(now.getTime() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years from now
      
      if (value < minDate) {
        return 'Unlock date must be at least 24 hours in the future';
      }
      
      if (value > maxDate) {
        return 'Unlock date cannot be more than 10 years in the future';
      }
      
      return true;
    },
  }, 'unlockDate');
};

/**
 * Validate letter title
 */
export const validateLetterTitle = (title: string): ValidationResult => {
  return validate(title, {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.ALPHANUMERIC_WITH_SPACES,
  }, 'title');
};

/**
 * Validate recipient address
 */
export const validateRecipientAddress = (address: string): ValidationResult => {
  return validate(address, {
    required: true,
    custom: (value) => validateEthAddress(value),
  }, 'recipientAddress');
};

/**
 * Validate encryption key
 */
export const validateEncryptionKey = (key: string): ValidationResult => {
  return validate(key, {
    required: true,
    minLength: 64,
    maxLength: 66, // 0x + 64 hex characters
    pattern: /^0x[a-fA-F0-9]{64}$/,
  }, 'encryptionKey');
};

/**
 * Create validation schema for letter form
 */
export const createLetterValidationSchema = () => ({
  title: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: VALIDATION_PATTERNS.ALPHANUMERIC_WITH_SPACES,
  },
  content: {
    required: true,
    minLength: 10,
    maxLength: 10000,
  },
  unlockDate: {
    required: true,
    future: true,
  },
  recipientAddress: {
    required: false, // Optional for public letters
    custom: (value: string) => {
      if (!value) return true; // Allow empty for public letters
      return validateEthAddress(value);
    },
  },
  isPublic: {
    required: false,
  },
});

/**
 * Validate letter form data
 */
export const validateLetterForm = (data: {
  title: string;
  content: string;
  unlockDate: string | Date;
  recipientAddress?: string;
  isPublic?: boolean;
}): ValidationResult => {
  const schema = createLetterValidationSchema();
  
  // Adjust validation based on whether it's public or private
  if (data.isPublic) {
    schema.recipientAddress.required = false;
  } else {
    schema.recipientAddress.required = true;
  }
  
  return validateForm(data, schema);
};

/**
 * Real-time validation hook
 */
export const useValidation = <T>(
  initialData: T,
  validationSchema: Record<string, ValidationRule>
) => {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, ValidationError[]>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((fieldName: string, value: any) => {
    const fieldRules = validationSchema[fieldName];
    if (!fieldRules) return;

    const result = validate(value, fieldRules, fieldName);
    setErrors(prev => ({
      ...prev,
      [fieldName]: result.errors,
    }));
  }, [validationSchema]);

  const validateAll = useCallback(() => {
    const result = validateForm(data as Record<string, any>, validationSchema);
    const fieldErrors: Record<string, ValidationError[]> = {};
    
    result.errors.forEach(error => {
      if (!fieldErrors[error.field]) {
        fieldErrors[error.field] = [];
      }
      fieldErrors[error.field].push(error);
    });
    
    setErrors(fieldErrors);
    return result.isValid;
  }, [data, validationSchema]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    
    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  }, [touched, validateField]);

  const setFieldTouched = useCallback((fieldName: string, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [fieldName]: isTouched }));
    
    if (isTouched) {
      const value = (data as Record<string, any>)[fieldName];
      validateField(fieldName, value);
    }
  }, [data, validateField]);

  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return errors[fieldName]?.[0]?.message;
  }, [errors]);

  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!errors[fieldName]?.length;
  }, [errors]);

  const isValid = useMemo(() => {
    return Object.keys(errors).every(field => !errors[field]?.length);
  }, [errors]);

  return {
    data,
    errors,
    touched,
    isValid,
    setFieldValue,
    setFieldTouched,
    validateField,
    validateAll,
    getFieldError,
    hasFieldError,
  };
};

/**
 * Debounced validation hook
 */
export const useDebouncedValidation = <T>(
  initialData: T,
  validationSchema: Record<string, ValidationRule>,
  delay: number = 300
) => {
  const [data, setData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Record<string, ValidationError[]>>({});
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedValidate = useCallback((fieldName: string, value: any) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      const fieldRules = validationSchema[fieldName];
      if (!fieldRules) return;

      const result = validate(value, fieldRules, fieldName);
      setErrors(prev => ({
        ...prev,
        [fieldName]: result.errors,
      }));
    }, delay);
  }, [validationSchema, delay]);

  const setFieldValue = useCallback((fieldName: string, value: any) => {
    setData(prev => ({ ...prev, [fieldName]: value }));
    debouncedValidate(fieldName, value);
  }, [debouncedValidate]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    errors,
    setFieldValue,
  };
};