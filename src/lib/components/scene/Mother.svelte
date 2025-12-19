<script lang="ts">
	import { sceneStore } from '$lib/stores/sceneStore';
	import type { SceneState } from '$lib/types/scene';

	let scene: SceneState;

	const unsubscribe = sceneStore.subscribe((state) => {
		scene = state;
	});
</script>

{#if scene?.characters.mother.visible}
	<!-- Mother interaction zone (invisible overlay for potential future interactions) -->
	<div
		class="mother-zone"
		style="position: absolute; left: {scene.characters.mother.x}px; top: {scene.characters.mother.y}px; width: {scene.characters.mother.width}px; height: {scene.characters.mother.height}px; pointer-events: auto;"
		role="img"
		aria-label="Mother character"
	/>
{/if}

