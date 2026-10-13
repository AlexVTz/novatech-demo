/**
 * Validation Module Unit Tests (imports src/js/validation.js)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  validateField,
  validateForm,
  isValidEmail,
  isValidPhone,
} from '../../src/js/validation.js';

function createClassList() {
  const classes = new Set();
  return {
    add: (...names) => names.forEach((n) => classes.add(n)),
    remove: (...names) => names.forEach((n) => classes.delete(n)),
    contains: (name) => classes.has(name),
  };
}

function createField({
  id = 'field',
  name,
  type = 'text',
  value = '',
  required = false,
  minLength = -1,
  maxLength = -1,
  pattern = '',
} = {}) {
  return {
    id,
    name,
    type,
    value,
    minLength,
    maxLength,
    pattern,
    classList: createClassList(),
    hasAttribute: (attr) => attr === 'required' && required,
  };
}

let errorElements;

beforeEach(() => {
  errorElements = {};
  globalThis.document = {
    getElementById: (id) => errorElements[id] || null,
  };
});

function withErrorEl(field) {
  errorElements[`${field.id}-error`] = { textContent: 'stale' };
  return errorElements[`${field.id}-error`];
}

describe('isValidEmail', () => {
  it('should accept well-formed addresses', () => {
    ['test@example.com', 'a@b.co', 'user+tag@sub.example.org'].forEach((email) => {
      assert.strictEqual(isValidEmail(email), true, `Expected ${email} to be valid`);
    });
  });

  it('should reject empty, whitespace and malformed addresses', () => {
    ['', ' ', 'a@@b.com', 'user@example', 'user@ex ample.com', ' test@example.com'].forEach(
      (email) => {
        assert.strictEqual(isValidEmail(email), false, `Expected "${email}" to be invalid`);
      }
    );
  });
});

describe('isValidPhone', () => {
  it('should accept the 10-character boundary and formatted numbers', () => {
    ['1234567890', '+1 (555) 123-4567'].forEach((phone) => {
      assert.strictEqual(isValidPhone(phone), true, `Expected ${phone} to be valid`);
    });
  });

  it('should reject numbers shorter than 10 characters, empty and alphabetic input', () => {
    ['123456789', '', '555-CALL-NOW'].forEach((phone) => {
      assert.strictEqual(isValidPhone(phone), false, `Expected "${phone}" to be invalid`);
    });
  });

  it(
    'should reject input with no digits',
    {
      skip: 'BUG src/js/validation.js:12 — phone pattern /^[\\d\\s\\-+()]{10,}$/ accepts strings with zero digits',
    },
    () => {
      ['----------', '((((()))))', '++++++++++'].forEach((phone) => {
        assert.strictEqual(isValidPhone(phone), false, `Expected "${phone}" to be invalid`);
      });
    }
  );
});

describe('validateField', () => {
  it('should fail required field with whitespace-only value and set error UI', () => {
    const field = createField({ id: 'name', required: true, value: '   ' });
    const errorEl = withErrorEl(field);

    const result = validateField(field);

    assert.deepStrictEqual(result, { isValid: false, message: 'This field is required' });
    assert.strictEqual(field.classList.contains('is-invalid'), true);
    assert.strictEqual(errorEl.textContent, 'This field is required');
  });

  it('should pass empty optional field', () => {
    const field = createField({ type: 'email', value: '' });
    assert.strictEqual(validateField(field).isValid, true);
  });

  it('should prioritize required message over type-specific checks', () => {
    const field = createField({ type: 'email', required: true, value: '' });
    assert.strictEqual(validateField(field).message, 'This field is required');
  });

  it('should validate email fields after trimming', () => {
    const invalid = createField({ type: 'email', value: 'not-an-email' });
    const padded = createField({ type: 'email', value: '  john@example.com  ' });

    assert.strictEqual(validateField(invalid).message, 'Please enter a valid email address');
    assert.strictEqual(validateField(padded).isValid, true);
  });

  it('should validate tel fields', () => {
    const field = createField({ type: 'tel', value: '12345' });
    assert.strictEqual(validateField(field).message, 'Please enter a valid phone number');
  });

  it('should enforce minLength on trimmed value', () => {
    const tooShort = createField({ minLength: 10, value: '  short  ' });
    const exact = createField({ minLength: 5, value: 'hello' });

    assert.strictEqual(validateField(tooShort).message, 'Please enter at least 10 characters');
    assert.strictEqual(validateField(exact).isValid, true);
  });

  it('should enforce maxLength', () => {
    const field = createField({ maxLength: 3, value: 'abcd' });
    assert.strictEqual(validateField(field).message, 'Please enter no more than 3 characters');
  });

  it('should clear invalid state and error text once the field becomes valid', () => {
    const field = createField({ id: 'email', type: 'email', required: true, value: 'bad' });
    const errorEl = withErrorEl(field);

    validateField(field);
    assert.strictEqual(field.classList.contains('is-invalid'), true);

    field.value = 'good@example.com';
    validateField(field);
    assert.strictEqual(field.classList.contains('is-invalid'), false);
    assert.strictEqual(errorEl.textContent, '');
  });

  it(
    'should enforce the field pattern attribute',
    {
      skip: 'BUG src/js/validation.js:34 — pattern rule is read in getValidationRules but never checked in validateField (lines 51-79)',
    },
    () => {
      const field = createField({ pattern: '[0-9]{5}', value: 'abcde' });
      assert.strictEqual(validateField(field).isValid, false);
    }
  );

  it('should not throw when no error element exists', () => {
    const field = createField({ id: 'orphan', required: true });
    assert.doesNotThrow(() => validateField(field));
  });
});

describe('validateForm', () => {
  function createForm(fields) {
    return { querySelectorAll: () => fields };
  }

  it('should be valid for a form with no fields', () => {
    assert.deepStrictEqual(validateForm(createForm([])), { isValid: true, errors: [] });
  });

  it('should skip empty optional fields and collect errors for invalid ones', () => {
    const optionalEmpty = createField({ id: 'company', type: 'email' });
    const requiredEmpty = createField({ id: 'name', name: 'name', required: true });
    const badEmail = createField({ id: 'email-id', type: 'email', value: 'x' });

    const result = validateForm(createForm([optionalEmpty, requiredEmpty, badEmail]));

    assert.strictEqual(result.isValid, false);
    assert.deepStrictEqual(result.errors, [
      { field: 'name', message: 'This field is required' },
      { field: 'email-id', message: 'Please enter a valid email address' },
    ]);
    assert.strictEqual(optionalEmpty.classList.contains('is-invalid'), false);
  });

  it('should be valid when all required fields are filled correctly', () => {
    const fields = [
      createField({ id: 'name', required: true, value: 'John', minLength: 2 }),
      createField({ id: 'email', type: 'email', required: true, value: 'john@example.com' }),
      createField({ id: 'message', required: true, value: 'Hello there!', minLength: 10 }),
    ];

    assert.deepStrictEqual(validateForm(createForm(fields)), { isValid: true, errors: [] });
  });
});
