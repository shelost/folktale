<script lang="ts">
	import { onMount } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import VideoPlayer from '$lib/components/animation/VideoPlayer.svelte';
	import AnimationIntroVideo from '$lib/components/ui/AnimationIntroVideo.svelte';
	import AnimationSubtitleOverlay from '$lib/components/ui/AnimationSubtitleOverlay.svelte';
	import AnimationNarrationManager from '$lib/components/ui/AnimationNarrationManager.svelte';
	import LanguageToggle from '$lib/components/ui/LanguageToggle.svelte';
	import AudioControls from '$lib/components/ui/AudioControls.svelte';
	import CulturalDictionaryPanel from '$lib/components/ui/CulturalDictionaryPanel.svelte';
	import ParentTipPanel from '$lib/components/ui/ParentTipPanel.svelte';
	import TigerSpeechBubble from '$lib/components/ui/TigerSpeechBubble.svelte';
	import CharacterClickZones from '$lib/components/ui/CharacterClickZones.svelte';
	import StepSlider from '$lib/components/ui/StepSlider.svelte';
	import Tiger from '$lib/components/scene/Tiger.svelte';
	import Mother from '$lib/components/scene/Mother.svelte';
	import RiceCakes from '$lib/components/scene/RiceCakes.svelte';
	import { sceneStore } from '$lib/stores/sceneStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { animationData } from '$lib/data/animation';
	import type { SceneStep } from '$lib/stores/stepStore';
	import type { Language } from '$lib/types/scene';

	let step = $state<SceneStep>('initial');
	let language: Language = $state('kr');
	let roarAudio: HTMLAudioElement | null = $state(null);
	let showUI = $state(false);
	let enableAudioSubtitles = $state(false);
	let uiTimers: number[] = [];

	const unsubscribeStep = currentStep.subscribe((s) => {
		const prevStep = step;
		step = s;

		if (s !== 'initial' && prevStep === 'initial') {
			uiTimers.push(
				window.setTimeout(() => { showUI = true; }, 800),
				window.setTimeout(() => { enableAudioSubtitles = true; }, 1400)
			);
		}

		if (s === 'initial') {
			showUI = false;
			enableAudioSubtitles = false;
			uiTimers.forEach((id) => clearTimeout(id));
			uiTimers = [];
		}
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	function handleRightHalfClick(e: PointerEvent) {
		if (step === 'initial' || !roarAudio) return;

		const target = e.target as HTMLElement;
		if (target.closest('button') || target.closest('.rice-cake-zone') || target.closest('video')) {
			return;
		}

		const clickX = e.clientX;
		const screenWidth = window.innerWidth;
		
		if (clickX > screenWidth / 2) {
			roarAudio.currentTime = 0;
			roarAudio.play().catch((error) => {
				console.error('Error playing roar sound:', error);
			});
		}
	}

	onMount(() => {
		sceneStore.set({
			currentScene: 'animation',
			language: 'kr',
			audioPlaying: false,
			audioCurrentTime: 0,
			characters: {
				tiger: { ...animationData.characters.tiger },
				mother: { ...animationData.characters.mother },
				riceCakes: animationData.characters.riceCakes ? [...animationData.characters.riceCakes] : []
			},
			interactionState: {
				dragging: false,
				dragItem: null,
				dragPosition: null,
				completedInteractions: [],
				riceCakesFed: 0
			}
		});

		roarAudio = new Audio('/roar.mov');
		roarAudio.preload = 'auto';

		return () => {
			unsubscribeStep();
			unsubscribeLang();
			uiTimers.forEach((id) => clearTimeout(id));
			if (roarAudio) {
				roarAudio.pause();
				roarAudio = null;
			}
		};
	});
</script>

<div class="scene-page" onpointerdown={handleRightHalfClick}>
	<AnimationIntroVideo />
	{#if step !== 'initial'}
		<VideoPlayer />
	{/if}
	{#if step === 'riceCakeVisible'}
		<div class="interaction-overlay"></div>
		<div class="interaction-explainer">
			<p class="explainer-text">
				{language === 'kr' 
					? '떡을 호랑이에게 드래그해서 주세요!' 
					: 'Drag the rice cakes to feed the tiger!'}
			</p>
		</div>
	{/if}
	{#if step === 'tigerEats' || step === 'complete'}
		<!-- Keep video visible but hide interaction elements -->
	{/if}
	{#if step !== 'initial'}
		<Tiger />
		<Mother />
	{/if}
	{#if step === 'riceCakeVisible'}
		<RiceCakes />
	{/if}
	{#if enableAudioSubtitles}
		<AnimationSubtitleOverlay />
		<AnimationNarrationManager />
	{/if}
	<TigerSpeechBubble />
	<CharacterClickZones />
	{#if showUI}
		<StepSlider />
		<CulturalDictionaryPanel entries={animationData.culturalDictionary} />
		<LanguageToggle />
		<AudioControls mode="narration" />
		<ParentTipPanel tips={animationData.parentTips} mode="animation" showDuringIntro={false} />
	{/if}
</div>

<style>
	.scene-page {
		position: relative;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		margin: 0;
		padding: 0;
		background: black;
	}


	.interaction-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.7);
		z-index: 500;
		pointer-events: none;
		animation: fadeIn 0.3s ease-in;
	}

	.interaction-explainer {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		z-index: 600;
		pointer-events: none;
		animation: fadeInUp 0.5s ease-out;
	}

	.explainer-text {
		background: linear-gradient(180deg, var(--storybook-paper) 0%, var(--storybook-paper-dark) 100%);
		border: 3px solid var(--storybook-border);
		border-radius: 16px;
		padding: 20px 32px;
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--storybook-ink);
		text-align: center;
		box-shadow: 0 8px 24px rgba(38, 23, 10, 0.4);
		margin: 0;
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
		white-space: nowrap;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translate(-50%, -40%);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -50%);
		}
	}

	@media (max-width: 768px) {
		.explainer-text {
			font-size: 1.2rem;
			padding: 16px 24px;
			white-space: normal;
		}
	}
</style>
