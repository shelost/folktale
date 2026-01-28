<script lang="ts">
	import { sceneStore, feedRiceCake } from '$lib/stores/sceneStore';
	import { interactionStore, completeInteraction, endDrag } from '$lib/stores/interactionStore';
	import { currentStep, nextStep } from '$lib/stores/stepStore';
	import type { SceneState } from '$lib/types/scene';
	import type { SceneStep } from '$lib/stores/stepStore';

	let scene = $state<SceneState | null>(null);
	let step = $state<SceneStep>('initial');
	let interactionState = $state({ dragging: false, dragItem: null as string | null, dragPosition: null as { x: number; y: number } | null, completedInteractions: [] as string[] });

	const unsubscribeScene = sceneStore.subscribe((state) => {
		scene = state as SceneState;
	});

	const unsubscribeInteraction = interactionStore.subscribe((state) => {
		interactionState = state;
	});

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
	});

	function handleTigerPointerUp(e: PointerEvent) {
		// Check if rice cake is being dragged and dropped on the circular drop zone
		if (!scene || !interactionState.dragging || !interactionState.dragItem || !interactionState.dragPosition) {
			return;
		}
		
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const riceCakeId = interactionState.dragItem;
		const riceCake = scene.characters.riceCakes.find((rc) => rc.id === riceCakeId);
		
		if (!riceCake || riceCake.fed) return;

		// Use the actual pointer position (clientX/clientY) for drop detection
		const dropX = e.clientX;
		const dropY = e.clientY;

		// Calculate center of circular drop zone (tiger's mouth area)
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		const radius = Math.min(rect.width, rect.height) / 2;
		
		// Calculate distance from drop point to center
		const distance = Math.sqrt(
			Math.pow(dropX - centerX, 2) + Math.pow(dropY - centerY, 2)
		);

		// Check if drop position is within circular drop zone
		if (distance <= radius) {
			feedRiceCake(riceCakeId);
			completeInteraction(`feed-tiger-${riceCakeId}`);
			
			// End drag immediately after successful drop
			endDrag();
			
			// Check if the rice cake has been fed (only 1 rice cake now)
			setTimeout(() => {
				sceneStore.subscribe((updatedState) => {
					if (updatedState.interactionState.riceCakesFed >= 1) {
						// Rice cake fed, move to next step
						nextStep();
					}
				})();
			}, 100);
		}
	}

	function handleTigerPointerOver() {
		// Visual feedback is handled by CSS class
	}

	// Show drop zone during riceCakeVisible step (no need to check tiger.visible since we use fixed positioning)
	const showDropZone = $derived(step === 'riceCakeVisible');
	const isDragging = $derived(interactionState.dragging && interactionState.dragItem && scene?.characters.riceCakes.some(rc => rc.id === interactionState.dragItem));
</script>

{#if showDropZone}
	<!-- Tiger circular drop zone - positioned to overlay where tiger appears in the video -->
	<div
		class="tiger-drop-zone"
		class:drop-target={isDragging}
		onpointerup={handleTigerPointerUp}
		onpointerover={handleTigerPointerOver}
		role="button"
		aria-label="Tiger - drop rice cake here"
		title={isDragging ? 'Drop rice cake on tiger' : 'Drop zone - drag rice cake here'}
	></div>
{/if}

<style>
	.tiger-drop-zone {
		/* Use fixed positioning with viewport percentages to match tiger in video */
		position: fixed;
		right: 15%;
		top: 25%;
		width: 35vw;
		height: 50vh;
		max-width: 400px;
		max-height: 400px;
		border-radius: 50%;
		transition: all 0.2s ease;
		z-index: 1001; /* Above dimming overlay, below rice cakes when dragging */
		pointer-events: auto;
		cursor: default;
		/* Always show a subtle outline so users know where to drop */
		border: 3px dashed rgba(255, 200, 0, 0.5);
		background: rgba(255, 200, 0, 0.15);
	}

	.tiger-drop-zone.drop-target {
		background: rgba(255, 200, 0, 0.4);
		border: 4px dashed #ff8800;
		box-shadow: 0 0 30px rgba(255, 136, 0, 0.8), inset 0 0 20px rgba(255, 200, 0, 0.3);
		animation: pulse 1s ease-in-out infinite;
		cursor: grab;
	}

	@keyframes pulse {
		0%, 100% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.05);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.tiger-drop-zone {
			right: 5%;
			top: 20%;
			width: 45vw;
			height: 45vh;
		}
	}
</style>

