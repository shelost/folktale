import { writable, derived } from 'svelte/store';
import type { AudioTiming, BilingualText } from '$lib/types/scene';
import { languageStore } from './languageStore';

export const audioPlaying = writable<boolean>(false);
export const audioCurrentTime = writable<number>(0);
export const audioDuration = writable<number>(0);
export const audioElement = writable<HTMLAudioElement | null>(null);

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

