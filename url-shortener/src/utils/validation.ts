import { URL } from 'url';

export function isValidUrl(urlCandidate: string): boolean {
    try {
        new URL(urlCandidate);
        return true;
    } catch (e) {
        return false;
    }
}