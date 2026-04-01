<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { currentSubtitleIndex as subtitleIndexStore } from '$lib/stores/subtitleStore';
	import { narrationElement } from '$lib/stores/audioStore';
	import { animationData } from '$lib/data/animation';
	import type { Language } from '$lib/types/scene';

	let step = $state('initial' as any);
	let language: Language = $state('kr');
	let subtitle = $state<string | null>(null);
	let currentSubtitleIndex = $state(0);
	let activeWordIndex = $state(0);
	let detachNarrationListeners: (() => void) | null = null;
	const AUDIO_SYNC_OFFSET_MS = 120;

	const keywordStyles: Record<string, { kr: string; en: string; color: string }> = {
		tiger: { kr: '호랑이', en: 'tiger', color: '#FF6B35' },
		riceCake: { kr: '떡', en: 'rice cake', color: '#C87000' },
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

	function splitWords(text: string): string[] {
		return text.trim().split(/\s+/).filter(Boolean);
	}

	function getWordSegments(word: string, lang: Language): Array<{ text: string; style: string }> {
		const lowerWord = word.toLowerCase();
		for (const key in keywordStyles) {
			const keyword = keywordStyles[key];
			const keywordText = (lang === 'kr' ? keyword.kr : keyword.en).toLowerCase();
			const idx = lowerWord.indexOf(keywordText);
			if (idx !== -1) {
				const style = `color: ${keyword.color}; font-weight: 700;`;
				const before = word.substring(0, idx);
				const match = word.substring(idx, idx + keywordText.length);
				const after = word.substring(idx + keywordText.length);
				const segments: Array<{ text: string; style: string }> = [];
				if (before) segments.push({ text: before, style: '' });
				segments.push({ text: match, style });
				if (after) segments.push({ text: after, style: '' });
				return segments;
			}
		}
		return [{ text: word, style: '' }];
	}

	function resetWordHighlight() {
		activeWordIndex = 0;
	}

	function tokenizeForTiming(text: string): string[] {
		return text.trim().split(/\s+/).filter(Boolean);
	}

	function hasPausePunctuation(token: string): boolean {
		return /[,.!?;:~…]$/.test(token);
	}

	function computeTokenWeight(token: string, lang: Language): number {
		const cleaned = token.replace(/[“”"(){}\[\]]/g, '');
		const charCount = cleaned.length;
		const isShort = charCount <= 1;
		const punctuationBonus = hasPausePunctuation(token) ? 0.95 : 0;
		const quoteBonus = /['"`]/.test(token) ? 0.2 : 0;

		if (lang === 'kr') {
			const base = Math.max(0.55, charCount * 0.9);
			return base + punctuationBonus + quoteBonus + (isShort ? -0.12 : 0);
		}

		const base = Math.max(0.5, charCount * 0.62);
		return base + punctuationBonus + quoteBonus + (isShort ? -0.08 : 0);
	}

	function buildCumulativeTiming(wordsValue: string[], lang: Language): number[] {
		if (wordsValue.length === 0) return [];
		const rawWeights = wordsValue.map((word) => computeTokenWeight(word, lang));
		const total = rawWeights.reduce((sum, weight) => sum + weight, 0);
		if (total <= 0) return wordsValue.map((_, i) => (i + 1) / wordsValue.length);

		let running = 0;
		return rawWeights.map((weight) => {
			running += weight;
			return running / total;
		});
	}

	function detachNarration() {
		if (detachNarrationListeners) {
			detachNarrationListeners();
			detachNarrationListeners = null;
		}
	}

	function attachNarration(audio: HTMLAudioElement | null) {
		detachNarration();
		if (!audio) return;

		const syncWordFromAudio = () => {
			const count = words.length;
			if (count <= 1) {
				activeWordIndex = 0;
				return;
			}
			const duration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
			if (!duration) return;
			const offsetSeconds = AUDIO_SYNC_OFFSET_MS / 1000;
			const effectiveTime = Math.min(duration, Math.max(0, audio.currentTime + offsetSeconds));
			const ratio = Math.min(0.999, Math.max(0, effectiveTime / duration));
			const index = cumulativeTiming.findIndex((boundary) => ratio <= boundary);
			activeWordIndex = index === -1 ? count - 1 : index;
		};

		const handleEnded = () => {
			activeWordIndex = Math.max(0, words.length - 1);
		};

		audio.addEventListener('timeupdate', syncWordFromAudio);
		audio.addEventListener('loadedmetadata', syncWordFromAudio);
		audio.addEventListener('play', syncWordFromAudio);
		audio.addEventListener('ended', handleEnded);

		detachNarrationListeners = () => {
			audio.removeEventListener('timeupdate', syncWordFromAudio);
			audio.removeEventListener('loadedmetadata', syncWordFromAudio);
			audio.removeEventListener('play', syncWordFromAudio);
			audio.removeEventListener('ended', handleEnded);
		};
	}

	const words = $derived(subtitle ? splitWords(subtitle) : []);
	const cumulativeTiming = $derived(buildCumulativeTiming(tokenizeForTiming(subtitle ?? ''), language));

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
		currentSubtitleIndex = 0; // Reset index when step changes
		subtitle = getSubtitleForStep(s, language, 0);
		resetWordHighlight();
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
		subtitle = getSubtitleForStep(step, lang, currentSubtitleIndex);
		resetWordHighlight();
	});

	const unsubscribeSubtitleIndex = subtitleIndexStore.subscribe((index) => {
		currentSubtitleIndex = index;
		// Update subtitle when index changes (for steps with multiple captions like motherFalls)
		subtitle = getSubtitleForStep(step, language, index);
		resetWordHighlight();
	});

	const unsubscribeNarration = narrationElement.subscribe((audio) => {
		attachNarration(audio);
	});

	onDestroy(() => {
		detachNarration();
		unsubscribeStep();
		unsubscribeLang();
		unsubscribeSubtitleIndex();
		unsubscribeNarration();
	});
</script>

{#if words.length > 0}
	<div class="subtitle-overlay" role="region" aria-live="polite" aria-label="Subtitle">
		<p class="subtitle-text">
			{#each words as word, index (index)}
				<span
					class="subtitle-word"
					class:active-word={index === activeWordIndex}
				>
					{#each getWordSegments(word, language) as seg}
						<span style={seg.style}>{seg.text}</span>
					{/each}
				</span>{' '}
			{/each}
		</p>
	</div>
{/if}

<style>
	.subtitle-overlay {
		position: fixed;
		bottom: 100px;
		left: 50%;
		transform: translateX(-50%);
		backdrop-filter: blur(4px);
		background: linear-gradient(180deg, rgba(242, 229, 200, 0.95) 0%, rgba(230, 212, 174, 0.95) 100%);
		box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
		color: var(--storybook-ink);
		padding: 20px 32px;
		border-radius: 10px;
		border: 2px solid var(--storybook-border);
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
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
		font-weight: 600;
		text-shadow: none;
	}

	.subtitle-word {
		transition: all 0.18s ease;
		display: inline-block;
		opacity: 1;
		padding: 0.02em 0.12em;
		border-radius: 0.2em;
	}

	.subtitle-word.active-word {
		background: rgba(255, 208, 120, 0.45);
		box-shadow: 0 0 0 1px rgba(171, 116, 45, 0.28) inset;
		transform: translateY(-1px);
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

