export const AUTH_TOKEN_STORAGE_KEY = 'token';

export function getStoredAuthToken(): string | null {
	try {
		return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
	} catch {
		return null;
	}
}

export function setStoredAuthToken(token: string): boolean {
	try {
		window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
		return true;
	} catch {
		return false;
	}
}

export function clearStoredAuthToken(): boolean {
	try {
		window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
		return true;
	} catch {
		return false;
	}
}
