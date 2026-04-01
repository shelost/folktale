<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { sceneStore, feedRiceCake } from '$lib/stores/sceneStore';
	import { interactionStore, startDrag, updateDragPosition, endDrag, completeInteraction } from '$lib/stores/interactionStore';
	import { nextStep } from '$lib/stores/stepStore';
	import type { SceneState, RiceCakeState } from '$lib/types/scene';

	let scene = $state<SceneState | null>(null);
	let interactionState = $state<SceneState['interactionState']>({
		dragging: false,
		dragItem: null,
		dragPosition: null,
		completedInteractions: [],
		riceCakesFed: 0
	});
	let draggingCakeId = $state<string | null>(null);
	let dragOffset = $state({ x: 0, y: 0 });
	let hoveredCakeId = $state<string | null>(null);

	const unsubscribeScene = sceneStore.subscribe((state) => {
		scene = state;
	});

	const unsubscribeInteraction = interactionStore.subscribe((state) => {
		interactionState = {
			dragging: state.dragging,
			dragItem: state.dragItem,
			dragPosition: state.dragPosition,
			completedInteractions: state.completedInteractions,
			riceCakesFed: state.riceCakesFed ?? 0
		};
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
		if (draggingCakeId && interactionState.dragging && scene) {
			// Check if we're dropping on the tiger's circular drop zone
			const tigerElement = document.querySelector('.tiger-drop-zone') as HTMLElement;
			if (tigerElement) {
				const tigerRect = tigerElement.getBoundingClientRect();
				const dropX = e.clientX;
				const dropY = e.clientY;
				
				// Calculate center and radius of circular drop zone
				const centerX = tigerRect.left + tigerRect.width / 2;
				const centerY = tigerRect.top + tigerRect.height / 2;
				const radius = Math.min(tigerRect.width, tigerRect.height) / 2;
				
				// Calculate distance from drop point to center
				const distance = Math.sqrt(
					Math.pow(dropX - centerX, 2) + Math.pow(dropY - centerY, 2)
				);
				
				// If dropping within circular zone, handle the drop here
				if (distance <= radius) {
					const riceCake = scene.characters.riceCakes.find((rc) => rc.id === draggingCakeId);
					if (riceCake && !riceCake.fed) {
						feedRiceCake(draggingCakeId);
						completeInteraction(`feed-tiger-${draggingCakeId}`);
						endDrag();
						draggingCakeId = null;
						nextStep();
						return;
					}
				}
			}
			
			// Not dropping on tiger, end drag
			endDrag();
			draggingCakeId = null;
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
	{#each scene.characters.riceCakes.filter(rc => rc.visible) as riceCake (riceCake.id)}
		{@const pos = getRiceCakePosition(riceCake)}
		{@const isDragging = draggingCakeId === riceCake.id}
		{@const isHovered = hoveredCakeId === riceCake.id}
		<!-- Draggable rice cake overlay -->
		<div
			class="rice-cake-zone"
			class:dragging={isDragging}
			class:hovered={isHovered && !isDragging}
			class:fed={riceCake.fed}
			style="position: absolute; left: {pos.x}px; top: {pos.y}px; width: {Math.max(riceCake.width, 120)}px; height: {Math.max(riceCake.height, 90)}px; min-width: 120px; min-height: 90px; pointer-events: {riceCake.fed ? 'none' : 'auto'} !important; cursor: {riceCake.draggable ? 'grab' : 'default'}; z-index: {riceCake.fed ? 1000 : 1002}; touch-action: none;"
			onpointerdown={(e) => { if (!riceCake.fed) handlePointerDown(e, riceCake); }}
			onpointerenter={() => { if (riceCake.draggable && !riceCake.fed) hoveredCakeId = riceCake.id; }}
			onpointerleave={() => { if (hoveredCakeId === riceCake.id) hoveredCakeId = null; }}
			role="button"
			aria-label="Rice cake - drag to tiger's mouth"
			title={riceCake.draggable ? 'Drag me to the tiger!' : ''}
			data-rice-cake-id={riceCake.id}
		>
			<img
				src="/tteok.png"
				alt="Rice cake"
				class="rice-cake-visual"
				draggable="false"
			/>
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
		object-fit: contain;
		transition: all 0.2s ease-out;
		user-select: none;
		-webkit-user-drag: none;
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

	.rice-cake-zone.fed {
		opacity: 0.9;
		pointer-events: none;
		cursor: default;
	}

	.rice-cake-zone.fed .rice-cake-visual {
		opacity: 0.8;
		transform: scale(0.9);
	}
</style>
