<script lang="ts">
	import { sceneStore, triggerSceneEvent, feedRiceCake } from '$lib/stores/sceneStore';
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
			const centerY = rect.top + rect.height * 0.4; // 40% down from top (mouth position)
			const radius = Math.min(rect.width, rect.height) * 0.6; // 60% of smaller dimension - much larger drop zone
			
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
</script>

{#if scene?.characters.tiger.visible && step === 'riceCakeVisible'}
	<!-- Tiger circular drop zone (at tiger's mouth) - only visible during interaction -->
	{@const tigerX = scene.characters.tiger.finalX ?? scene.characters.tiger.x}
	{@const tigerY = scene.characters.tiger.y}
	{@const centerX = tigerX + scene.characters.tiger.width / 2}
	{@const centerY = tigerY + scene.characters.tiger.height * 0.4}
	{@const radius = Math.min(scene.characters.tiger.width, scene.characters.tiger.height) * 0.6}
	<div
		class="tiger-drop-zone"
		class:drop-target={interactionState.dragging && interactionState.dragItem && scene.characters.riceCakes.some(rc => rc.id === interactionState.dragItem)}
		style="position: absolute; left: {centerX - radius}px; top: {centerY - radius}px; width: {radius * 2}px; height: {radius * 2}px; pointer-events: auto; cursor: {interactionState.dragging && interactionState.dragItem && scene.characters.riceCakes.some(rc => rc.id === interactionState.dragItem) ? 'grab' : 'default'}; z-index: 1003;"
		onpointerup={handleTigerPointerUp}
		onpointerover={handleTigerPointerOver}
		role="button"
		aria-label="Tiger - drop rice cake here"
		title={interactionState.dragging && interactionState.dragItem && scene?.characters.riceCakes.some(rc => rc.id === interactionState.dragItem) ? 'Drop rice cake on tiger' : 'Drop zone - drag rice cake here'}
	></div>
{/if}

<style>
	.tiger-drop-zone {
		border-radius: 50%;
		transition: all 0.2s ease;
		z-index: 1001; /* Above dimming overlay, below rice cakes when dragging */
		/* Always show a subtle outline so users know where to drop */
		border: 2px dashed rgba(255, 200, 0, 0.4);
		background: rgba(255, 200, 0, 0.1);
	}

	.tiger-drop-zone.drop-target {
		background: rgba(255, 200, 0, 0.4);
		border: 4px dashed #ff8800;
		box-shadow: 0 0 30px rgba(255, 136, 0, 0.8), inset 0 0 20px rgba(255, 200, 0, 0.3);
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
</style>

