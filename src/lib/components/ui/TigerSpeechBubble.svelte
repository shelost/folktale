<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import { currentSubtitleIndex } from '$lib/stores/subtitleStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { animationData } from '$lib/data/animation';
	import type { Language } from '$lib/types/scene';
	import type { SceneStep } from '$lib/stores/stepStore';

	let step = $state<SceneStep>('initial');
	let subtitleIndex = $state(0);
	let language: Language = $state('kr');

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
	});

	const unsubscribeSubtitleIndex = currentSubtitleIndex.subscribe((index) => {
		subtitleIndex = index;
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	// Map steps to subtitle timings (matching AnimationNarrationManager)
	const stepToSubtitleMap: Record<string, number[]> = {
		'tigerAppears': [1.0],
		'motherFalls': [4.0, 7.0], // Index 0 = 4.0, Index 1 = 7.0 (tiger speaks)
		'riceCakeVisible': [14.0],
		'tigerEats': [19.0]
	};

	// Get the timing value for the current step and subtitle index
	function getCurrentTiming(): number | null {
		if (step !== 'motherFalls') return null;
		const timings = stepToSubtitleMap[step];
		if (!timings || subtitleIndex >= timings.length) return null;
		return timings[subtitleIndex];
	}

	// Show speech bubble ONLY when timing is exactly 7.0 (tiger's dialogue)
	const currentTiming = $derived(getCurrentTiming());
	const showBubble = $derived(
		step === 'motherFalls' && currentTiming === 7.0
	);

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeSubtitleIndex();
		unsubscribeLang();
	});
</script>

{#if showBubble}
	<div
		class="speech-bubble"
		role="region"
		aria-label="Tiger speech"
	>
		<img src="bubble.png" alt="Tiger speech bubble" class="speech-bubble-image">
	</div>
{/if}

<style>

	.speech-bubble {
		position: fixed;
		top: 15%;
		left: 25%;
		z-index: 200;
		pointer-events: none;
		animation: bubbleAppear 0.4s ease-out;
		max-width: min(400px, calc(100vw - 40px));
	}

    .speech-bubble-image{
        height: 180px;
    }

	.speech-bubble-content {
		background-image: url('/bubble.png');
		background-size: contain;
		background-repeat: no-repeat;
		background-position: center;
		position: relative;
		width: 100%;
		min-height: 400px;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px 30px;
        animation: bubbleShake 1s ease-in-out infinite;
	}

    @keyframes bubbleShake {
        0% {
            transform: translateX(0px);
        }
        100% {
            transform: translateX(10px);
        }
    }

	.speech-text {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
		color: #333;
		line-height: 1.5;
		text-align: center;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		position: relative;
		z-index: 1;
		padding: 10px;
	}

	@keyframes bubbleAppear {
		from {
			opacity: 0;
			transform: scale(0.8) translateY(10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (max-width: 768px) {
		.speech-bubble {
			left: 5%;
			max-width: calc(100vw - 20px);
		}

		.speech-bubble-content {
			min-height: 120px;
			padding: 15px 20px;
		}

		.speech-text {
			font-size: 1rem;
		}
	}
</style>

