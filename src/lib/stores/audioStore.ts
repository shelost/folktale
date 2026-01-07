import { writable, derived, get } from 'svelte/store';
import type { AudioTiming, BilingualText } from '$lib/types/scene';
import { languageStore } from './languageStore';

export const audioPlaying = writable<boolean>(false);
export const audioCurrentTime = writable<number>(0);
export const audioDuration = writable<number>(0);
export const audioElement = writable<HTMLAudioElement | null>(null);

// Narration-specific state
export const narrationPlaying = writable<boolean>(false);
export const narrationLoading = writable<boolean>(false);
export const narrationElement = writable<HTMLAudioElement | null>(null);
export const narrationError = writable<string | null>(null);

export function getCurrentSubtitle(timings: AudioTiming[], currentTime: number, lang: 'kr' | 'en'): string | null {
	// Find the most recent timing that hasn't passed yet
	for (let i = timings.length - 1; i >= 0; i--) {
		if (currentTime >= timings[i].time) {
			return timings[i].text[lang];
		}
	}
	return null;
}

export function createAudioElement(url?: string): HTMLAudioElement {
	const audio = new Audio(url);
	audio.preload = 'auto';
	
	audio.addEventListener('loadedmetadata', () => {
		audioDuration.set(audio.duration);
	});
	
	audio.addEventListener('timeupdate', () => {
		audioCurrentTime.set(audio.currentTime);
	});
	
	audio.addEventListener('ended', () => {
		audioPlaying.set(false);
		audioCurrentTime.set(0);
	});
	
	audioElement.set(audio);
	return audio;
}

export function playAudio(audio: HTMLAudioElement) {
	audio.play().then(() => {
		audioPlaying.set(true);
	}).catch((error) => {
		console.error('Error playing audio:', error);
	});
}

export function pauseAudio(audio: HTMLAudioElement) {
	audio.pause();
	audioPlaying.set(false);
}

export function toggleAudio(audio: HTMLAudioElement | null) {
	if (!audio) return;
	let playing = false;
	const unsubscribe = audioPlaying.subscribe((isPlaying) => {
		playing = isPlaying;
	});
	
	if (playing) {
		pauseAudio(audio);
	} else {
		playAudio(audio);
	}
	
	unsubscribe();
}

// Narration functions
export function createNarrationElement(url: string): HTMLAudioElement {
	// Stop any existing narration
	stopNarration();

	const audio = new Audio(url);
	audio.preload = 'auto';
	
	audio.addEventListener('loadedmetadata', () => {
		narrationLoading.set(false);
	});

	audio.addEventListener('play', () => {
		narrationPlaying.set(true);
		narrationError.set(null);
	});

	audio.addEventListener('pause', () => {
		narrationPlaying.set(false);
	});

	audio.addEventListener('ended', () => {
		narrationPlaying.set(false);
		narrationElement.set(null);
	});

	audio.addEventListener('error', (e) => {
		console.error('Narration audio error:', e);
		narrationLoading.set(false);
		narrationPlaying.set(false);
		narrationError.set('Failed to play narration');
		narrationElement.set(null);
	});

	narrationElement.set(audio);
	return audio;
}

export function playNarration(audio: HTMLAudioElement) {
	narrationLoading.set(true);
	audio.play().then(() => {
		narrationPlaying.set(true);
		narrationLoading.set(false);
		narrationError.set(null);
	}).catch((error) => {
		console.error('Error playing narration:', error);
		narrationLoading.set(false);
		narrationPlaying.set(false);
		narrationError.set('Failed to play narration');
	});
}

export function stopNarration() {
	const audio = get(narrationElement);

	if (audio) {
		audio.pause();
		audio.currentTime = 0;
		narrationElement.set(null);
	}
	narrationPlaying.set(false);
	narrationLoading.set(false);
	narrationError.set(null);
}

export function pauseNarration() {
	const audio = get(narrationElement);

	if (audio) {
		audio.pause();
		narrationPlaying.set(false);
	}
}

