<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sceneStore, triggerSceneEvent, feedRiceCake } from '$lib/stores/sceneStore';
	import { interactionStore, completeInteraction } from '$lib/stores/interactionStore';
	import { currentStep, nextStep } from '$lib/stores/stepStore';
	import { scene3Data } from '$lib/data/scene3';
	import type { SceneState } from '$lib/types/scene';

	let scene = $state<SceneState | null>(null);
	let interactionState = $state({ dragging: false, dragItem: null as string | null, dragPosition: null as { x: number; y: number } | null, completedInteractions: [] as string[] });

	const unsubscribeScene = sceneStore.subscribe((state) => {
		scene = state;
	});

	const unsubscribeInteraction = interactionStore.subscribe((state) => {
		interactionState = state;
	});

	onDestroy(() => {
		unsubscribeScene();
		unsubscribeInteraction();
	});

	// Reactive derived state for dragging check
	let isDragging = $derived(
		interactionState.dragging && 
		interactionState.dragItem !== null && 
		scene !== null &&
		scene.characters.riceCakes.some(rc => rc.id === interactionState.dragItem && !rc.fed)
	);

	function handleTigerPointerUp(e: PointerEvent) {
		// Check if rice cake is being dragged and dropped anywhere on the tiger
		if (interactionState.dragging && interactionState.dragItem && interactionState.dragPosition && scene) {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const riceCakeId = interactionState.dragItem;
			const riceCake = scene.characters.riceCakes.find((rc) => rc.id === riceCakeId);
			
			if (!riceCake || riceCake.fed) return;

			// Use the pointer event coordinates (clientX/clientY) which are in viewport coordinates
			// Check if pointer is within the tiger's bounds
			if (
				e.clientX >= rect.left &&
				e.clientX <= rect.right &&
				e.clientY >= rect.top &&
				e.clientY <= rect.bottom
			) {
				feedRiceCake(riceCakeId);
				completeInteraction(`feed-tiger-${riceCakeId}`);
				
				// Check if all 5 rice cakes have been fed
				// Use a small delay to allow state to update
				setTimeout(() => {
					sceneStore.subscribe((updatedState) => {
						if (updatedState.interactionState.riceCakesFed >= 5) {
							// All rice cakes fed, move to complete step
							nextStep();
						}
					})();
				}, 100);
			}
		}
	}

	function handleTigerPointerOver() {
		// Visual feedback is handled by CSS class
	}
</script>

{#if scene?.characters.tiger.visible}
	<!-- Tiger drop zone (covers entire tiger sprite) -->
	<div
		class="tiger-drop-zone"
		class:drop-target={isDragging}
		style="position: absolute; left: {scene.characters.tiger.finalX ?? scene.characters.tiger.x}px; top: {scene.characters.tiger.y}px; width: {scene.characters.tiger.width}px; height: {scene.characters.tiger.height}px; pointer-events: {isDragging ? 'auto' : 'none'}; cursor: {isDragging ? 'grab' : 'default'}; z-index: 1500;"
		onpointerup={handleTigerPointerUp}
		onpointerover={handleTigerPointerOver}
		role="button"
		aria-label="Tiger - drop rice cake here"
		title={isDragging ? 'Drop rice cake on tiger' : ''}
	/>
	
	<!-- Circular drop zone indicator -->
	{#if isDragging}
		<div
			class="drop-zone-indicator"
			style="position: absolute; left: {(scene.characters.tiger.finalX ?? scene.characters.tiger.x) + scene.characters.tiger.width / 2}px; top: {scene.characters.tiger.y + scene.characters.tiger.height * 0.4}px; transform: translate(-50%, -50%);"
		/>
	{/if}
{/if}

<style>
	.tiger-drop-zone {
		border-radius: 12px;
		transition: all 0.2s ease;
	}

	.tiger-drop-zone.drop-target {
		background: rgba(255, 200, 0, 0.2);
		border: 3px dashed #ff8800;
		box-shadow: 0 0 20px rgba(255, 136, 0, 0.5);
		animation: pulse 1s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.02);
			opacity: 1;
		}
	}

	.drop-zone-indicator {
		width: 120px;
		height: 120px;
		border-radius: 50%;
		border: 4px solid #ff8800;
		background: rgba(255, 200, 0, 0.3);
		box-shadow: 0 0 30px rgba(255, 136, 0, 0.6), inset 0 0 20px rgba(255, 200, 0, 0.2);
		pointer-events: none;
		z-index: 1500;
		animation: dropZonePulse 1.2s ease-in-out infinite;
	}

	@keyframes dropZonePulse {
		0%, 100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 0.8;
		}
		50% {
			transform: translate(-50%, -50%) scale(1.15);
			opacity: 1;
		}
	}
</style>

