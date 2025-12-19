<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { sceneStore } from '$lib/stores/sceneStore';
	import { audioCurrentTime, createAudioElement, playAudio } from '$lib/stores/audioStore';
	import { interactionStore } from '$lib/stores/interactionStore';
	import { drawScene } from '$lib/utils/canvasRenderer';
	import { loadImages, getImages } from '$lib/utils/imageLoader';
	import { scene3Data } from '$lib/data/scene3';
	import { triggerSceneEvent } from '$lib/stores/sceneStore';
	import type { SceneState } from '$lib/types/scene';
	import type { LoadedImages } from '$lib/utils/imageLoader';

	let { children } = $props();

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null = null;
	let animationFrame: number | null = null;
	let scene: SceneState;
	let interactionState = $state({ dragging: false, dragItem: null, dragPosition: null, completedInteractions: [] });
	let draggingCakeId = $state<string | null>(null);
	let images = $state<LoadedImages>({ tiger: null, mother: null });

	const unsubscribeScene = sceneStore.subscribe((state) => {
		scene = state;
	});

	const unsubscribeInteraction = interactionStore.subscribe((state) => {
		interactionState = state;
		// Extract rice cake ID from dragItem (it's just the ID now)
		if (state.dragItem && state.dragging) {
			draggingCakeId = state.dragItem;
		} else {
			draggingCakeId = null;
		}
	});

	function calculateCharacterPositions(width: number, height: number) {
		sceneStore.update((state) => {
			// Mother: left center of screen
			const motherWidth = state.characters.mother.width;
			const motherHeight = state.characters.mother.height;
			const motherX = 50; // Left side with some padding
			const motherY = (height - motherHeight) / 2; // Vertically centered
			
			// Tiger: right center of screen
			const tigerWidth = state.characters.tiger.width;
			const tigerHeight = state.characters.tiger.height;
			const tigerX = width - tigerWidth - 50; // Right side with some padding
			const tigerY = (height - tigerHeight) / 2; // Vertically centered
			
			// Update character positions
			return {
				...state,
				characters: {
					...state.characters,
					mother: {
						...state.characters.mother,
						x: motherX,
						y: motherY
					},
					tiger: {
						...state.characters.tiger,
						x: tigerX,
						y: tigerY,
						finalX: tigerX // Set finalX for animation
					},
					// Update rice cake positions relative to mother
					riceCakes: state.characters.riceCakes.map((rc, index) => {
						const bowlX = motherX + motherWidth / 2;
						const bowlY = motherY + motherHeight - 60;
						const offsetX = ((index % 3) - 1) * 70;
						const offsetY = Math.floor(index / 3) * 50;
						return {
							...rc,
							x: bowlX - rc.width / 2 + offsetX,
							y: bowlY - rc.height / 2 + offsetY
						};
					})
				}
			};
		});
	}

	function setupCanvas() {
		if (!canvas || !browser) return;

		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		ctx = canvas.getContext('2d');

		if (!ctx) {
			console.error('Failed to get canvas context');
			return;
		}

		// Calculate character positions based on canvas size
		calculateCharacterPositions(canvas.width, canvas.height);

		// Start render loop
		render();
	}

	function render() {
		if (!ctx || !canvas || !scene) {
			animationFrame = requestAnimationFrame(render);
			return;
		}

		// Check if tiger appearing animation is complete
		if (scene.characters.tiger.animationState === 'appearing' && 
		    scene.characters.tiger.animationStartTime !== undefined && 
		    scene.characters.tiger.finalX !== undefined) {
			const animationDuration = 800;
			const elapsed = Date.now() - scene.characters.tiger.animationStartTime;
			if (elapsed >= animationDuration) {
				// Animation complete, transition to idle
				sceneStore.update((state) => ({
					...state,
					characters: {
						...state.characters,
						tiger: {
							...state.characters.tiger,
							animationState: 'idle',
							x: state.characters.tiger.finalX ?? state.characters.tiger.x,
							// Ensure finalX is preserved
							finalX: state.characters.tiger.finalX
						}
					}
				}));
			}
		}

		// Check if mother falling animation is complete
		if (scene.characters.mother.animationState === 'falling' && 
		    scene.characters.mother.animationStartTime !== undefined) {
			const animationDuration = 600;
			const elapsed = Date.now() - scene.characters.mother.animationStartTime;
			if (elapsed >= animationDuration) {
				// Animation complete, transition to fallen state
				sceneStore.update((state) => ({
					...state,
					characters: {
						...state.characters,
						mother: {
							...state.characters.mother,
							animationState: 'fallen'
						}
					}
				}));
				
				// After a delay, get back up to normal position
				setTimeout(() => {
					sceneStore.update((state) => ({
						...state,
						characters: {
							...state.characters,
							mother: {
								...state.characters.mother,
								animationState: 'walking'
							}
						}
					}));
				}, 1500); // Stay fallen for 1.5 seconds, then get back up
			}
		}

		// Draw scene with images (images may be null initially, renderer handles fallback)
		drawScene(
			ctx,
			canvas.width,
			canvas.height,
			scene,
			scene3Data.background.color,
			images,
			interactionState.dragPosition,
			draggingCakeId
		);

		animationFrame = requestAnimationFrame(render);
	}

	function handleResize() {
		if (canvas && browser) {
			canvas.width = window.innerWidth;
			canvas.height = window.innerHeight;
			// Recalculate character positions on resize
			calculateCharacterPositions(canvas.width, canvas.height);
		}
	}

	onMount(() => {
		if (!browser) return;
		
		// Load images first
		loadImages().then((loadedImages) => {
			images = loadedImages;
			setupCanvas();
		});
		
		window.addEventListener('resize', handleResize);

		// Scene progression is now manual via Next button
		// Audio timing is only used for subtitle synchronization
		const audio = createAudioElement(scene3Data.audio.url);
	});

	onDestroy(() => {
		if (browser) {
			window.removeEventListener('resize', handleResize);
			if (animationFrame !== null) {
				cancelAnimationFrame(animationFrame);
			}
		}
		unsubscribeScene();
		unsubscribeInteraction();
	});
</script>

<canvas
	bind:this={canvas}
	class="scene-canvas"
	style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; pointer-events: none;"
></canvas>

<div class="interaction-layer" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 2;">
	{@render children()}
</div>

<style>
	.scene-canvas {
		display: block;
	}

	.interaction-layer {
		/* Allow pointer events for interactive children */
	}
</style>

