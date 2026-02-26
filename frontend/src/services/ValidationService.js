/**
 * Form Validation Service
 * Handles all form input validation
 */

export class ValidationService {
    /**
     * Validate email address
     */
    static isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Validate username/nickname
     * - 3-20 characters
     * - Alphanumeric, underscore, hyphen only
     */
    static isValidUsername(username) {
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        return usernameRegex.test(username);
    }

    /**
     * Validate password
     * - Minimum 8 characters
     * - At least one uppercase, lowercase, number, and special character
     */
    static isValidPassword(password) {
        if (password.length < 8) {
            return { valid: false, message: 'Password must be at least 8 characters.' };
        }
        if (!/[A-Z]/.test(password)) {
            return { valid: false, message: 'Password must contain an uppercase letter.' };
        }
        if (!/[a-z]/.test(password)) {
            return { valid: false, message: 'Password must contain a lowercase letter.' };
        }
        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Password must contain a number.' };
        }
        if (!/[!@#$%^&*]/.test(password)) {
            return { valid: false, message: 'Password must contain a special character (!@#$%^&*).' };
        }
        return { valid: true, message: '' };
    }

    /**
     * Validate promotion code
     */
    static isValidPromotionCode(code) {
        return code && code.trim().length > 0;
    }

    /**
     * Validate verification code
     * - 6 digits
     */
    static isValidVerificationCode(code) {
        return /^\d{6}$/.test(code);
    }

    /**
     * Get validation error message
     */
    static getErrorMessage(field, value) {
        switch (field) {
            case 'email':
                return !value ? 'Email is required.' : 'Please enter a valid email address.';
            case 'username':
                return !value ? 'Username is required.' : 'Username must be 3-20 characters (letters, numbers, _ or -)';
            case 'password':
                return !value ? 'Password is required.' : ValidationService.isValidPassword(value).message;
            case 'confirmPassword':
                return !value ? 'Please confirm your password.' : 'Passwords do not match.';
            case 'verificationCode':
                return !value ? 'Verification code is required.' : 'Please enter a valid 6-digit code.';
            default:
                return 'Invalid input.';
        }
    }
}

export default ValidationService;
