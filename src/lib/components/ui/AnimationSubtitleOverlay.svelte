<script lang="ts">
	import { currentStep } from '$lib/stores/stepStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { animationData } from '$lib/data/animation';
	import type { Language } from '$lib/types/scene';

	let step = $state('initial' as any);
	let language: Language = $state('kr');
	let subtitle = $state<string | null>(null);

	// Map steps to subtitle timings
	const stepToSubtitleMap: Record<string, number> = {
		'tigerAppears': 1.0,
		'motherFalls': 4.0, // Combined caption for motherFalls and tigerSpeaks - only show once
		'riceCakeVisible': 11.0,
		'tigerEats': 15.0 // Final caption after rice cake is fed
	};

	function getSubtitleForStep(stepValue: string, lang: Language): string | null {
		const timing = stepToSubtitleMap[stepValue];
		if (!timing) return null;

		const subtitleEntry = animationData.audio.timings.find((t) => t.time === timing);
		if (!subtitleEntry) return null;

		return subtitleEntry.text[lang] || null;
	}

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
		subtitle = getSubtitleForStep(s, language);
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
		subtitle = getSubtitleForStep(step, lang);
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

