import { UseFormSetError, FieldValues, Path } from 'react-hook-form';
import { getValidationErrors, isValidationError } from './error';

/**
 * Maps backend validation errors to react-hook-form field errors
 * 
 * @param error - The API error from catch block
 * @param setError - react-hook-form's setError function
 * @returns true if validation errors were mapped, false otherwise
 * 
 * @example
 * try {
 *   await api.createUser(data);
 * } catch (error) {
 *   if (mapBackendValidationErrors(error, setError)) {
 *     return; // Form errors are now displayed
 *   }
 *   // Handle other errors
 * }
 */
export const mapBackendValidationErrors = <T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>
): boolean => {
  if (!isValidationError(error)) {
    return false;
  }

  const validationErrors = getValidationErrors(error);
  let hasErrors = false;

  Object.entries(validationErrors).forEach(([field, message]) => {
    if (field === '_general') {
      // General errors can be shown as a toast
      return;
    }

    // Map backend field names to form field names
    const formField = mapBackendFieldToFormField(field);
    
    setError(formField as Path<T>, {
      type: 'backend',
      message: message,
    });

    hasErrors = true;
  });

  return hasErrors;
};

/**
 * Maps backend field names to form field names
 * Handles common naming convention differences
 */
const mapBackendFieldToFormField = (backendField: string): string => {
  // Handle nested fields (e.g., "user.email" -> "email")
  const parts = backendField.split('.');
  const fieldName = parts[parts.length - 1];

  // Common field name mappings
  const fieldMappings: Record<string, string> = {
    'email_address': 'email',
    'phone_number': 'phone',
    'first_name': 'firstName',
    'last_name': 'lastName',
    'user_name': 'username',
  };

  return fieldMappings[fieldName.toLowerCase()] || fieldName;
};

/**
 * Email validation
 */
export const validateEmail = (email?: string): string | true => {
  if (!email || !email.trim()) {
    return true; // Optional
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email không hợp lệ';
  }

  return true;
};

/**
 * Phone validation (Vietnamese format)
 */
export const validatePhone = (phone: string): string | true => {
  if (!phone) {
    return true; // Optional field
  }

  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Số điện thoại không hợp lệ (VD: 0912345678)';
  }

  return true;
};

/**
 * Required field validation
 */
export const validateRequired = (fieldName: string) => (value: unknown): string | true => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} là bắt buộc`;
  }
  return true;
};

/**
 * Min length validation
 */
export const validateMinLength = (min: number, fieldName: string) => (value?: string): string | true => {
  if (value && value.length < min) {
    return `${fieldName} phải có ít nhất ${min} ký tự`;
  }
  return true;
};

/**
 * Max length validation
 */
export const validateMaxLength = (max: number, fieldName: string) => (value?: string): string | true => {
  if (value && value.length > max) {
    return `${fieldName} không được vĐặt quá ${max} kỳ từ`;
  }
  return true;
};

/**
 * URL validation
 */
export const validateURL = (url: string): string | true => {
  if (!url) {
    return true; // Optional
  }

  try {
    new URL(url);
    return true;
  } catch {
    return 'URL không hợp lệ';
  }
};

/**
 * Number validation
 */
export const validateNumber = (fieldName: string) => (value: unknown): string | true => {
  if (value === '' || value === null || value === undefined) {
    return true; // Let required validator handle this
  }

  const num = Number(value);
  if (isNaN(num)) {
    return `${fieldName} phải là số`;
  }

  return true;
};

/**
 * Positive number validation
 */
export const validatePositiveNumber = (fieldName: string) => (value: unknown): string | true => {
  const numberValidation = validateNumber(fieldName)(value);
  if (numberValidation !== true) {
    return numberValidation;
  }

  if (value !== '' && value !== null && value !== undefined) {
    const num = Number(value);
    if (num <= 0) {
      return `${fieldName} phải lớn hơn 0`;
    }
  }

  return true;
};

/**
 * Date validation
 */
export const validateDate = (date: string): string | true => {
  if (!date) {
    return true; // Optional
  }

  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) {
    return 'Ngày không hợp lệ';
  }

  return true;
};

/**
 * Future date validation
 */
export const validateFutureDate = (date: string): string | true => {
  const dateValidation = validateDate(date);
  if (dateValidation !== true) {
    return dateValidation;
  }

  if (date) {
    const dateObj = new Date(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    if (dateObj < now) {
      return 'Ngày phải trong tương lai';
    }
  }

  return true;
};

/**
 * Past date validation
 */
export const validatePastDate = (date: string): string | true => {
  const dateValidation = validateDate(date);
  if (dateValidation !== true) {
    return dateValidation;
  }

  if (date) {
    const dateObj = new Date(date);
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    if (dateObj > now) {
      return 'Ngày phải trong quá khứ';
    }
  }

  return true;
};

/**
 * Password strength validation
 */
export const validatePassword = (password: string): string | true => {
  if (!password) {
    return 'Mật khẩu là bắt buộc';
  }

  if (password.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự';
  }

  if (!/[A-Z]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ hoa';
  }

  if (!/[a-z]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ thường';
  }

  if (!/[0-9]/.test(password)) {
    return 'Mật khẩu phải chứa ít nhất 1 chữ số';
  }

  return true;
};

/**
 * Confirm password validation
 */
export const validateConfirmPassword = (password: string) => (confirmPassword: string): string | true => {
  if (confirmPassword !== password) {
    return 'Mật khẩu xác nhận không khớp';
  }
  return true;
};

/**
 * Username validation
 */
export const validateUsername = (username: string): string | true => {
  if (!username) {
    return 'Tên đăng nhập là bắt buộc';
  }

  if (username.length < 3) {
    return 'Tên đăng nhập phải có ít nhất 3 ký tự';
  }

  if (username.length > 50) {
    return 'Tên đăng nhập không được vượt quá 50 ký tự';
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang';
  }

  return true;
};

/**
 * Check for duplicate email via API
 */
export const checkDuplicateEmail = async (
  email: string,
  checkEmailApi: (email: string) => Promise<boolean>,
  currentEmail?: string
): Promise<string | true> => {
  // Skip check if email hasn't changed (for edit forms)
  if (currentEmail && email === currentEmail) {
    return true;
  }

  const emailValidation = validateEmail(email);
  if (emailValidation !== true) {
    return emailValidation;
  }

  try {
    const isDuplicate = await checkEmailApi(email);
    if (isDuplicate) {
      return 'Email đã được sử dụng';
    }
    return true;
  } catch {
    // If API check fails, allow submission (server will validate)
    return true;
  }
};
