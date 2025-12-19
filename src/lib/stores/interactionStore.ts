import { writable } from 'svelte/store';
import type { Position } from '$lib/types/scene';

export interface InteractionState {
	dragging: boolean;
	dragItem: string | null;
	dragPosition: Position | null;
	completedInteractions: string[];
	riceCakesFed?: number;
}

export const interactionStore = writable<InteractionState>({
	dragging: false,
	dragItem: null,
	dragPosition: null,
	completedInteractions: []
});

export function startDrag(itemId: string, position: Position) {
	interactionStore.update((state) => ({
		...state,
		dragging: true,
		dragItem: itemId,
		dragPosition: position
	}));
}

export function updateDragPosition(position: Position) {
	interactionStore.update((state) => ({
		...state,
		dragPosition: position
	}));
}

export function endDrag() {
	interactionStore.update((state) => ({
		...state,
		dragging: false,
		dragItem: null,
		dragPosition: null
	}));
}

export function completeInteraction(interactionId: string) {
	interactionStore.update((state) => ({
		...state,
		completedInteractions: [...state.completedInteractions, interactionId],
		dragging: false,
		dragItem: null,
		dragPosition: null
	}));
}

export function isInteractionCompleted(interactionId: string): boolean {
	let completed = false;
	interactionStore.subscribe((state) => {
		completed = state.completedInteractions.includes(interactionId);
	})();
	return completed;
}

