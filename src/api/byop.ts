const STORAGE_KEY = "tfa_api_key";

export function getStoredApiKey(): string {
    try {
        return localStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
        return "";
    }
}

export function setStoredApiKey(key: string): void {
    try {
        if (key.trim()) {
            localStorage.setItem(STORAGE_KEY, key.trim());
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    } catch {
        // storage unavailable
    }
}

export function hasApiKey(): boolean {
    return getStoredApiKey().length > 0;
}
