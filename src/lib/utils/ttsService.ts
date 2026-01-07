import { browser } from '$app/environment';
import type { Language } from '$lib/types/scene';

interface CachedAudio {
	text: string;
	language: Language;
	voice: string;
	audioBlob: Blob;
	timestamp: number;
}

const DB_NAME = 'folktale-tts-cache';
const DB_VERSION = 1;
const STORE_NAME = 'audio-cache';

let db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
	if (!browser) {
		throw new Error('IndexedDB is only available in browser');
	}

	if (db) {
		return db;
	}

	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);

		request.onerror = () => reject(request.error);
		request.onsuccess = () => {
			db = request.result;
			resolve(db);
		};

		request.onupgradeneeded = (event) => {
			const database = (event.target as IDBOpenDBRequest).result;
			if (!database.objectStoreNames.contains(STORE_NAME)) {
				const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
				objectStore.createIndex('timestamp', 'timestamp', { unique: false });
			}
		};
	});
}

async function generateCacheKey(text: string, language: Language, voice: string): Promise<string> {
	if (!browser) {
		return `${text}-${language}-${voice}`;
	}

	const encoder = new TextEncoder();
	const data = encoder.encode(`${text}|${language}|${voice}`);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getCachedAudio(key: string): Promise<Blob | null> {
	if (!browser) {
		return null;
	}

	try {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const transaction = database.transaction([STORE_NAME], 'readonly');
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get(key);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => {
				const result = request.result;
				if (result) {
					resolve(result.audioBlob);
				} else {
					resolve(null);
				}
			};
		});
	} catch (error) {
		console.error('Error reading from cache:', error);
		return null;
	}
}

async function cacheAudio(key: string, text: string, language: Language, voice: string, audioBlob: Blob): Promise<void> {
	if (!browser) {
		return;
	}

	try {
		const database = await openDB();
		return new Promise((resolve, reject) => {
			const transaction = database.transaction([STORE_NAME], 'readwrite');
			const store = transaction.objectStore(STORE_NAME);
			const entry: CachedAudio & { key: string } = {
				key,
				text,
				language,
				voice,
				audioBlob,
				timestamp: Date.now()
			};

			const request = store.put(entry);

			request.onerror = () => reject(request.error);
			request.onsuccess = () => resolve();
		});
	} catch (error) {
		console.error('Error caching audio:', error);
		// Don't throw - caching failure shouldn't break the app
	}
}

async function generateAudioFromAPI(text: string, language: Language, voice?: string): Promise<Blob> {
	const model = 'tts-1';
	const selectedVoice = voice || (language === 'kr' ? 'nova' : 'alloy');

	const response = await fetch('/api/tts', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			text,
			language,
			voice: selectedVoice,
			model
		})
	});

	if (!response.ok) {
		const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
		throw new Error(errorData.error || `HTTP ${response.status}`);
	}

	const data = await response.json();
	
	// Convert base64 back to blob
	const binaryString = atob(data.audio);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return new Blob([bytes], { type: 'audio/mpeg' });
}

export async function getAudioForText(
	text: string,
	language: Language,
	voice?: string
): Promise<string> {
	if (!browser) {
		throw new Error('TTS is only available in browser');
	}

	if (!text || text.trim() === '') {
		throw new Error('Text cannot be empty');
	}

	const selectedVoice = voice || (language === 'kr' ? 'nova' : 'alloy');
	const cacheKey = await generateCacheKey(text, language, selectedVoice);

	// Check cache first
	const cachedBlob = await getCachedAudio(cacheKey);
	if (cachedBlob) {
		return URL.createObjectURL(cachedBlob);
	}

	// Generate new audio
	const audioBlob = await generateAudioFromAPI(text, language, selectedVoice);

	// Cache it
	await cacheAudio(cacheKey, text, language, selectedVoice, audioBlob);

	// Return blob URL
	return URL.createObjectURL(audioBlob);
}

export async function preloadAudio(text: string, language: Language, voice?: string): Promise<void> {
	try {
		await getAudioForText(text, language, voice);
	} catch (error) {
		console.warn('Failed to preload audio:', error);
		// Don't throw - preloading failure shouldn't break the app
	}
}

export function revokeAudioURL(url: string): void {
	if (browser && url.startsWith('blob:')) {
		URL.revokeObjectURL(url);
	}
}

