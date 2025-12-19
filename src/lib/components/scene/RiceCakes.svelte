<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { sceneStore, feedRiceCake } from '$lib/stores/sceneStore';
	import { interactionStore, startDrag, updateDragPosition, endDrag } from '$lib/stores/interactionStore';
	import type { SceneState, RiceCakeState } from '$lib/types/scene';

	let scene = $state<SceneState | null>(null);
	let interactionState = $state({ dragging: false, dragItem: null, dragPosition: null, completedInteractions: [], riceCakesFed: 0 });
	let draggingCakeId = $state<string | null>(null);
	let dragOffset = $state({ x: 0, y: 0 });
	let hoveredCakeId = $state<string | null>(null);

	const unsubscribeScene = sceneStore.subscribe((state) => {
		scene = state;
	});

	const unsubscribeInteraction = interactionStore.subscribe((state) => {
		interactionState = state;
	});

	function handlePointerDown(e: PointerEvent, riceCake: RiceCakeState) {
		if (!riceCake.draggable || riceCake.fed) {
			return;
		}

		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const startX = e.clientX;
		const startY = e.clientY;
		
		dragOffset = {
			x: startX - rect.left,
			y: startY - rect.top
		};

		startDrag(riceCake.id, {
			x: startX,
			y: startY
		});

		draggingCakeId = riceCake.id;
		const target = e.currentTarget as HTMLElement;
		target.setPointerCapture(e.pointerId);

		e.preventDefault();
		e.stopPropagation();
	}

	function handleGlobalPointerMove(e: PointerEvent) {
		if (draggingCakeId && interactionState.dragging) {
			updateDragPosition({
				x: e.clientX - dragOffset.x,
				y: e.clientY - dragOffset.y
			});
			e.preventDefault();
		}
	}

	function handleGlobalPointerUp(e: PointerEvent) {
		if (draggingCakeId) {
			// Check if we're dropping on the tiger by checking if pointer is over tiger
			const tigerElement = document.querySelector('.tiger-drop-zone') as HTMLElement;
			if (tigerElement) {
				const rect = tigerElement.getBoundingClientRect();
				if (
					e.clientX >= rect.left &&
					e.clientX <= rect.right &&
					e.clientY >= rect.top &&
					e.clientY <= rect.bottom
				) {
					// Trigger pointerup on tiger element to handle drop
					const pointerUpEvent = new PointerEvent('pointerup', {
						bubbles: true,
						cancelable: true,
						clientX: e.clientX,
						clientY: e.clientY,
						pointerId: e.pointerId
					});
					tigerElement.dispatchEvent(pointerUpEvent);
				}
			}
			
			// Delay ending drag to allow Tiger component to detect drop
			setTimeout(() => {
				if (interactionState.dragging && draggingCakeId) {
					endDrag();
					draggingCakeId = null;
				}
			}, 200);
		}
	}

	function getRiceCakePosition(riceCake: RiceCakeState): { x: number; y: number } {
		if (draggingCakeId === riceCake.id && interactionState.dragPosition) {
			return {
				x: interactionState.dragPosition.x,
				y: interactionState.dragPosition.y
			};
		}
		return {
			x: riceCake.x,
			y: riceCake.y
		};
	}

	onMount(() => {
		if (!browser) return;
		
		document.addEventListener('pointermove', handleGlobalPointerMove);
		document.addEventListener('pointerup', handleGlobalPointerUp);
		
		return () => {
			document.removeEventListener('pointermove', handleGlobalPointerMove);
			document.removeEventListener('pointerup', handleGlobalPointerUp);
		};
	});

	onDestroy(() => {
		unsubscribeScene();
		unsubscribeInteraction();
	});
</script>

{#if scene?.characters.riceCakes}
	{#each scene.characters.riceCakes.filter(rc => rc.visible && !rc.fed) as riceCake (riceCake.id)}
		{@const pos = getRiceCakePosition(riceCake)}
		{@const isDragging = draggingCakeId === riceCake.id}
		{@const isHovered = hoveredCakeId === riceCake.id}
		<!-- Draggable rice cake overlay -->
		<div
			class="rice-cake-zone"
			class:dragging={isDragging}
			class:hovered={isHovered && !isDragging}
			style="position: absolute; left: {pos.x}px; top: {pos.y}px; width: {Math.max(riceCake.width, 40)}px; height: {Math.max(riceCake.height, 30)}px; min-width: 40px; min-height: 30px; pointer-events: auto !important; cursor: {riceCake.draggable ? 'grab' : 'default'}; z-index: {isDragging ? 2000 : 1000}; touch-action: none;"
			onpointerdown={(e) => handlePointerDown(e, riceCake)}
			onpointerenter={() => { if (riceCake.draggable && !riceCake.fed) hoveredCakeId = riceCake.id; }}
			onpointerleave={() => { if (hoveredCakeId === riceCake.id) hoveredCakeId = null; }}
			role="button"
			aria-label="Rice cake - drag to tiger's mouth"
			title={riceCake.draggable ? 'Drag me to the tiger!' : ''}
			data-rice-cake-id={riceCake.id}
		>
			<div class="rice-cake-visual"></div>
		</div>
	{/each}
{/if}

<style>
	.rice-cake-zone {
		transition: transform 0.2s ease-out, opacity 0.2s ease-out, box-shadow 0.2s ease-out;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.rice-cake-visual {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #fff8dc 0%, #ffe4b5 100%);
		border: 2px solid #d4a574;
		border-radius: 6px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s ease-out;
	}

	.rice-cake-zone:hovered .rice-cake-visual {
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(255, 200, 0, 0.6), 0 0 20px rgba(255, 200, 0, 0.4);
		border-color: #ffaa00;
		background: linear-gradient(135deg, #fffef0 0%, #ffe8b8 100%);
	}

	.rice-cake-zone.dragging {
		transform: scale(1.3) rotate(8deg);
		opacity: 0.95;
		cursor: grabbing !important;
		z-index: 2000;
	}

	.rice-cake-zone.dragging .rice-cake-visual {
		box-shadow: 0 6px 20px rgba(255, 200, 0, 0.8), 0 0 30px rgba(255, 200, 0, 0.6);
		border-color: #ff8800;
	}

	.rice-cake-zone:not(.dragging):not(.hovered) {
		cursor: grab;
	}

	.rice-cake-zone:not(.dragging):not(.hovered):hover {
		transform: scale(1.05);
	}
</style>
