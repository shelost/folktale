import { writable } from 'svelte/store';
import type { Language } from '$lib/types/scene';

export const languageStore = writable<Language>('kr');

export function toggleLanguage() {
	languageStore.update((lang) => (lang === 'kr' ? 'en' : 'kr'));
}

export function setLanguage(lang: Language) {
	languageStore.set(lang);
}

