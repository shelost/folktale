import { writable } from 'svelte/store';
import type { SceneState, TigerState, MotherState, RiceCakeState } from '$lib/types/scene';
import { scene3Data } from '$lib/data/scene3';

const initialState: SceneState = {
	currentScene: 'scene3',
	language: 'kr',
	audioPlaying: false,
	audioCurrentTime: 0,
	characters: {
		tiger: { ...scene3Data.characters.tiger },
		mother: { ...scene3Data.characters.mother },
		riceCakes: scene3Data.characters.riceCakes ? [...scene3Data.characters.riceCakes] : []
	},
	interactionState: {
		dragging: false,
		dragItem: null,
		dragPosition: null,
		completedInteractions: [],
		riceCakesFed: 0
	}
};

export const sceneStore = writable<SceneState>(initialState);

export function updateTiger(tiger: Partial<TigerState>) {
	sceneStore.update((state) => ({
		...state,
		characters: {
			...state.characters,
			tiger: { ...state.characters.tiger, ...tiger }
		}
	}));
}

export function updateMother(mother: Partial<MotherState>) {
	sceneStore.update((state) => ({
		...state,
		characters: {
			...state.characters,
			mother: { ...mother }
		}
	}));
}

export function updateRiceCake(riceCakeId: string, updates: Partial<RiceCakeState>) {
	sceneStore.update((state) => ({
		...state,
		characters: {
			...state.characters,
			riceCakes: state.characters.riceCakes.map((rc) =>
				rc.id === riceCakeId ? { ...rc, ...updates } : rc
			)
		}
	}));
}

export function feedRiceCake(riceCakeId: string) {
	sceneStore.update((state) => {
		// Calculate tiger's mouth position
		const tigerX = state.characters.tiger.finalX ?? state.characters.tiger.x;
		const tigerMouthX = tigerX + state.characters.tiger.width / 2;
		const tigerMouthY = state.characters.tiger.y + state.characters.tiger.height * 0.4; // Approximate mouth position (40% down from top)
		
		// Count how many rice cakes are already fed to stack them
		const fedCount = state.characters.riceCakes.filter((rc) => rc.fed).length;
		
		// Position fed rice cakes in the tiger's mouth area, slightly offset for stacking
		const offsetX = (fedCount % 3) * 15 - 15; // Stack horizontally with larger offset for bigger sprites
		const offsetY = Math.floor(fedCount / 3) * 12; // Stack vertically if many, larger offset
		
		const updatedRiceCakes = state.characters.riceCakes.map((rc) => {
			if (rc.id === riceCakeId) {
				return {
					...rc,
					visible: true, // Keep visible but positioned at tiger's mouth
					draggable: false,
					fed: true,
					x: tigerMouthX - rc.width / 2 + offsetX,
					y: tigerMouthY - rc.height / 2 + offsetY
				};
			}
			return rc;
		});
		const riceCakesFed = updatedRiceCakes.filter((rc) => rc.fed).length;
		
		return {
			...state,
			characters: {
				...state.characters,
				riceCakes: updatedRiceCakes,
				tiger: { ...state.characters.tiger, mouthOpen: true, animationState: 'eating' }
			},
			interactionState: {
				...state.interactionState,
				riceCakesFed
			}
		};
	});
	
	// Reset tiger mouth after animation
	setTimeout(() => {
		sceneStore.update((state) => {
			const allFed = state.characters.riceCakes.every((rc) => rc.fed || !rc.visible);
			return {
				...state,
				characters: {
					...state.characters,
					tiger: { 
						...state.characters.tiger, 
						mouthOpen: false, 
						animationState: allFed ? 'idle' : 'speaking' 
					}
				}
			};
		});
	}, 1000);
}

export function triggerSceneEvent(event: string) {
	sceneStore.update((state) => {
		// Handle scene progression events
		if (event === 'tigerAppears') {
			const finalX = state.characters.tiger.x; // Store final position (from scene data: 600)
			return {
				...state,
				characters: {
					...state.characters,
					tiger: { 
						...state.characters.tiger, 
						visible: true, 
						animationState: 'appearing',
						animationStartTime: Date.now(),
						finalX: finalX
						// Don't change x here - let the renderer calculate start position based on canvas width
					}
				}
			};
		}
		
		if (event === 'motherFalls') {
			return {
				...state,
				characters: {
					...state.characters,
					mother: { 
						...state.characters.mother, 
						animationState: 'falling',
						animationStartTime: Date.now()
					}
				}
			};
		}
		
		if (event === 'tigerSpeaks') {
			return {
				...state,
				characters: {
					...state.characters,
					tiger: { ...state.characters.tiger, animationState: 'speaking' }
				}
			};
		}
		
		if (event === 'riceCakeVisible') {
			return {
				...state,
				characters: {
					...state.characters,
					riceCakes: state.characters.riceCakes.map((rc) => ({
						...rc,
						visible: true,
						draggable: true
					}))
				}
			};
		}
		
		return state;
	});
}

