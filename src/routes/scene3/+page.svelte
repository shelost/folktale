<script lang="ts">
	import SceneContainer from '$lib/components/scene/SceneContainer.svelte';
	import Tiger from '$lib/components/scene/Tiger.svelte';
	import Mother from '$lib/components/scene/Mother.svelte';
	import RiceCakes from '$lib/components/scene/RiceCakes.svelte';
	import SubtitleOverlay from '$lib/components/ui/SubtitleOverlay.svelte';
	import LanguageToggle from '$lib/components/ui/LanguageToggle.svelte';
	import AudioControls from '$lib/components/ui/AudioControls.svelte';
	import CulturalDictionary from '$lib/components/ui/CulturalDictionary.svelte';
	import ParentTip from '$lib/components/ui/ParentTip.svelte';
	import NextButton from '$lib/components/ui/NextButton.svelte';
	import StepSlider from '$lib/components/ui/StepSlider.svelte';
</script>

<div class="scene-page">
	<StepSlider />
	<SceneContainer>
		<Tiger />
		<Mother />
		<RiceCakes />
	</SceneContainer>
	
	<SubtitleOverlay />
	<LanguageToggle />
	<AudioControls />
	<CulturalDictionary />
	<ParentTip />
	<NextButton />
</div>

<style>
	.scene-page {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		margin: 0;
		padding: 0;
	}
</style>

