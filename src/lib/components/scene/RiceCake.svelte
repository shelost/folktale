<script lang="ts">
	import { sceneStore } from '$lib/stores/sceneStore';
	import { interactionStore, startDrag, updateDragPosition, endDrag } from '$lib/stores/interactionStore';
	import type { SceneState } from '$lib/types/scene';

	let scene: SceneState;
	let interactionState = $state({ dragging: false, dragItem: null, dragPosition: null, completedInteractions: [] });
	let isDragging = $state(false);
	let dragOffset = $state({ x: 0, y: 0 });

	const unsubscribeScene = sceneStore.subscribe((state) => {
		scene = state;
	});

	const unsubscribeInteraction = interactionStore.subscribe((state) => {
		interactionState = state;
		isDragging = state.dragging && state.dragItem === 'riceCake';
	});

	function handlePointerDown(e: PointerEvent) {
		if (!scene?.characters.riceCake.draggable) return;

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const startX = e.clientX;
		const startY = e.clientY;
		
		dragOffset = {
			x: startX - rect.left,
			y: startY - rect.top
		};

		startDrag('riceCake', {
			x: startX,
			y: startY
		});

		isDragging = true;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

		e.preventDefault();
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging) return;

		updateDragPosition({
			x: e.clientX - dragOffset.x,
			y: e.clientY - dragOffset.y
		});
	}

	function handlePointerUp(e: PointerEvent) {
		if (!isDragging) return;

		isDragging = false;
		(e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
		
		// Delay ending drag to allow Tiger component to detect drop
		// Tiger component will call completeInteraction which ends the drag
		setTimeout(() => {
			if (interactionState.dragging && interactionState.dragItem === 'riceCake') {
				endDrag();
			}
		}, 150);
	}
</script>

{#if scene?.characters.riceCake.visible}
	<!-- Draggable rice cake overlay -->
	<div
		class="rice-cake-zone"
		class:dragging={isDragging}
		style="position: absolute; left: {isDragging && interactionState.dragPosition ? interactionState.dragPosition.x : scene.characters.riceCake.x}px; top: {isDragging && interactionState.dragPosition ? interactionState.dragPosition.y : scene.characters.riceCake.y}px; width: {scene.characters.riceCake.width}px; height: {scene.characters.riceCake.height}px; pointer-events: {scene.characters.riceCake.draggable ? 'auto' : 'none'}; cursor: {scene.characters.riceCake.draggable ? 'grab' : 'default'}; z-index: 10;"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		role="button"
		aria-label="Rice cake - drag to tiger's mouth"
		title={scene.characters.riceCake.draggable ? 'Drag me to the tiger!' : ''}
	/>
{/if}

<style>
	.rice-cake-zone {
		transition: transform 0.1s ease-out, opacity 0.1s ease-out;
		border-radius: 4px;
	}

	.rice-cake-zone.dragging {
		transform: scale(1.2) rotate(5deg);
		opacity: 0.9;
		cursor: grabbing !important;
		z-index: 100;
	}

	.rice-cake-zone:not(.dragging):hover {
		transform: scale(1.05);
		cursor: grab;
	}
</style>

