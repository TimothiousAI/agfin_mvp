/**
 * Test script for utility functions
 * Run with: npx ts-node src/shared/utils/test-utils.ts
 */

import * as dateUtils from './date';
import * as stringUtils from './string';
import * as numberUtils from './number';
import * as validationUtils from './validation';

console.log('=== Testing Date Utilities ===\n');

const testDate = new Date('2026-01-15T12:30:00Z');
console.log('formatDate:', dateUtils.formatDate(testDate));
console.log('formatDateTime:', dateUtils.formatDateTime(testDate));
console.log('isToday:', dateUtils.isToday(new Date()));
console.log('isYesterday:', dateUtils.isYesterday(new Date(Date.now() - 86400000)));
console.log('getRelativeTime (2 hours ago):', dateUtils.getRelativeTime(Date.now() - 7200000));

console.log('\n=== Testing String Utilities ===\n');

console.log('truncate:', stringUtils.truncate('This is a very long string that needs truncating', 20));
console.log('capitalize:', stringUtils.capitalize('hello world'));
console.log('capitalizeWords:', stringUtils.capitalizeWords('hello world'));
console.log('slugify:', stringUtils.slugify('Hello World! This is a Test'));
console.log('camelToKebab:', stringUtils.camelToKebab('myVariableName'));
console.log('kebabToCamel:', stringUtils.kebabToCamel('my-variable-name'));
console.log('getInitials:', stringUtils.getInitials('John Doe'));
console.log('pluralize (1 item):', stringUtils.pluralize('item', 1));
console.log('pluralize (5 items):', stringUtils.pluralize('item', 5));
console.log('maskString:', stringUtils.maskString('secret-api-key-12345'));

console.log('\n=== Testing Number Utilities ===\n');

console.log('formatCurrency:', numberUtils.formatCurrency(1234.56));
console.log('formatPercentage:', numberUtils.formatPercentage(85.7));
console.log('formatCompactNumber (1.5M):', numberUtils.formatCompactNumber(1500000));
console.log('formatNumber:', numberUtils.formatNumber(1234567));
console.log('clamp (5, 0, 10):', numberUtils.clamp(5, 0, 10));
console.log('clamp (15, 0, 10):', numberUtils.clamp(15, 0, 10));
console.log('roundTo (3.14159, 2):', numberUtils.roundTo(3.14159, 2));
console.log('calculatePercentage (25, 100):', numberUtils.calculatePercentage(25, 100) + '%');

console.log('\n=== Testing Validation Utilities ===\n');

console.log('isValidEmail (valid):', validationUtils.isValidEmail('user@example.com'));
console.log('isValidEmail (invalid):', validationUtils.isValidEmail('not-an-email'));
console.log('isValidUrl (valid):', validationUtils.isValidUrl('https://example.com'));
console.log('isValidUrl (invalid):', validationUtils.isValidUrl('not-a-url'));
console.log('isEmpty (empty string):', validationUtils.isEmpty(''));
console.log('isEmpty (whitespace):', validationUtils.isEmpty('   '));
console.log('isEmpty (text):', validationUtils.isEmpty('hello'));
console.log('isNumber:', validationUtils.isNumber(42));
console.log('isString:', validationUtils.isString('hello'));
console.log('isArray:', validationUtils.isArray([1, 2, 3]));
console.log('isObject:', validationUtils.isObject({ key: 'value' }));
console.log('isDefined:', validationUtils.isDefined('value'));
console.log('isNullish (null):', validationUtils.isNullish(null));

console.log('\n✅ All utility tests complete!');
