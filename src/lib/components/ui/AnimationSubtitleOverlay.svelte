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

	// Keywords to highlight with their colors
	const keywordStyles: Record<string, { kr: string; en: string; color: string }> = {
		tiger: { kr: '호랑이', en: 'tiger', color: '#FF6B35' },
		riceCake: { kr: '떡', en: 'rice cake', color: '#FFD700' },
		mother: { kr: '어머니', en: 'mother', color: '#FF69B4' },
		roar: { kr: '어흥', en: 'Roar', color: '#FF4500' }
	};

	// Map steps to subtitle timings (MUST match AnimationNarrationManager exactly)
	const stepToSubtitleMap: Record<string, number[]> = {
		'tigerAppears': [1.0],           // 어느 날, 어머니는 떡을 가지고...
		'motherFalls': [4.0, 7.0],       // 그때 갑자기 호랑이가... / 어머니는 깜짝 놀라...
		'riceCakeVisible': [14.0],       // 어머니는 떡 하나를 주었어요
		'tigerEats': [19.0]              // 호랑이는 떡을 먹고...
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

	// Function to highlight keywords in the subtitle text
	function highlightKeywords(text: string, lang: Language): string {
		let result = text;
		
		for (const key in keywordStyles) {
			const keyword = keywordStyles[key];
			const word = lang === 'kr' ? keyword.kr : keyword.en;
			const color = keyword.color;
			
			// Case-insensitive replacement for English
			if (lang === 'en') {
				const regex = new RegExp(`(${word})`, 'gi');
				result = result.replace(regex, `<span class="keyword" style="color: ${color}; font-weight: 700;">$1</span>`);
			} else {
				// Korean doesn't need case-insensitive
				result = result.replace(
					new RegExp(word, 'g'),
					`<span class="keyword" style="color: ${color}; font-weight: 700;">${word}</span>`
				);
			}
		}
		
		return result;
	}

	// Derived state for highlighted subtitle
	const highlightedSubtitle = $derived(subtitle ? highlightKeywords(subtitle, language) : null);

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

{#if highlightedSubtitle}
	<div class="subtitle-overlay" role="region" aria-live="polite" aria-label="Subtitle">
		<p class="subtitle-text">{@html highlightedSubtitle}</p>
	</div>
{/if}

<style>
	.subtitle-overlay {
		position: fixed;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
		backdrop-filter: blur(10px);
		background: rgba(0, 0, 0, 0.85);
		box-shadow: -4px 18px 24px 0 rgba(0, 0, 0, 0.6);
		color: white;
		padding: 20px 32px;
		border-radius: 12px;
		max-width: 85%;
		text-align: center;
		z-index: 100;
		font-size: 1.8rem;
		line-height: 1.7;
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
		font-weight: 500;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
	}

	/* Keyword highlight styles */
	.subtitle-text :global(.keyword) {
		text-shadow: 0 0 10px currentColor, 1px 1px 2px rgba(0, 0, 0, 0.5);
		transition: all 0.2s ease;
	}

	@media (max-width: 768px) {
		.subtitle-overlay {
			font-size: 1.4rem;
			padding: 16px 24px;
			max-width: 90%;
			bottom: 80px;
		}
	}
</style>

