<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { currentSubtitleIndex as subtitleIndexStore } from '$lib/stores/subtitleStore';
	import { animationData } from '$lib/data/animation';
	import type { Language } from '$lib/types/scene';

	let step = $state('initial' as any);
	let language: Language = $state('kr');
	let subtitle = $state<string | null>(null);
	let currentSubtitleIndex = $state(0);

	// Map steps to subtitle timings
	// motherFalls will show both captions (1.0 and 4.0) sequentially
	const stepToSubtitleMap: Record<string, number[]> = {
		'tigerAppears': [1.0],
		'motherFalls': [1.0, 4.0], // Combined step: show caption at 1.0 first, then 4.0
		'riceCakeVisible': [11.0],
		'tigerEats': [15.0] // Final caption after rice cake is fed
	};

	function getSubtitleForStep(stepValue: string, lang: Language, index: number = 0): string | null {
		const timings = stepToSubtitleMap[stepValue];
		if (!timings || !Array.isArray(timings)) return null;
		if (index >= timings.length) return null;

		const timing = timings[index];
		const subtitleEntry = animationData.audio.timings.find((t) => t.time === timing);
		if (!subtitleEntry) return null;

		return subtitleEntry.text[lang] || null;
	}

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
		currentSubtitleIndex = 0; // Reset index when step changes
		subtitle = getSubtitleForStep(s, language, 0);
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
		subtitle = getSubtitleForStep(step, lang, currentSubtitleIndex);
	});

	const unsubscribeSubtitleIndex = subtitleIndexStore.subscribe((index) => {
		currentSubtitleIndex = index;
		// Update subtitle when index changes (for steps with multiple captions like motherFalls)
		subtitle = getSubtitleForStep(step, language, index);
	});

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeLang();
		unsubscribeSubtitleIndex();
	});
</script>

{#if subtitle}
	<div class="subtitle-overlay" role="region" aria-live="polite" aria-label="Subtitle">
		<p class="subtitle-text">{subtitle}</p>
	</div>
{/if}

<style>
	.subtitle-overlay {
		position: fixed;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.8);
		color: white;
		padding: 16px 24px;
		border-radius: 8px;
		max-width: 80%;
		text-align: center;
		z-index: 100;
		font-size: 1.2rem;
		line-height: 1.6;
		animation: fadeIn 0.3s ease-in;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(0);
		}
	}

	.subtitle-text {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style>

