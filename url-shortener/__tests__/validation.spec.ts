import { isValidUrl } from '../src/utils/validation';

describe('isValidUrl', () => {
    test('should return true for a valid HTTP URL', () => {
        expect(isValidUrl('http://example.com')).toBe(true);
    });

    test('should return true for a valid HTTPS URL', () => {
        expect(isValidUrl('https://www.google.com/search?q=test')).toBe(true);
    });

    test('should return true for a URL with a port', () => {
        expect(isValidUrl('http://localhost:8080/path')).toBe(true);
    });

    test('should return true for a URL with an IP address', () => {
        expect(isValidUrl('http://192.168.1.1/resource')).toBe(true);
    });

    test('should return false for an invalid URL string', () => {
        expect(isValidUrl('invalid-url')).toBe(false);
    });

    test('should return false for an empty string', () => {
        expect(isValidUrl('')).toBe(false);
    });

    test('should return false for a URL without a protocol', () => {
        expect(isValidUrl('www.example.com')).toBe(false);
    });

    test('should return false for a malformed URL', () => {
        expect(isValidUrl('http://')).toBe(false);
    });

    test('should return false for just a domain without protocol', () => {
        expect(isValidUrl('example.com')).toBe(false);
    });
});