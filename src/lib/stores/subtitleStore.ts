import { writable } from 'svelte/store';

// Store to track the current subtitle index for steps with multiple captions
export const currentSubtitleIndex = writable<number>(0);

// Function to update subtitle index (called by narration manager)
export function setSubtitleIndex(index: number) {
	currentSubtitleIndex.set(index);
}

// Function to reset subtitle index (called when step changes)
export function resetSubtitleIndex() {
	currentSubtitleIndex.set(0);
}

