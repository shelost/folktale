<script lang="ts">
	import { onDestroy } from 'svelte';
	import { get } from 'svelte/store';
	import { currentStep } from '$lib/stores/stepStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { narrationPlaying, narrationElement, pauseNarration } from '$lib/stores/audioStore';
	import { getAudioForText, revokeAudioURL } from '$lib/utils/ttsService';
	import type { SceneStep } from '$lib/stores/stepStore';
	import type { Language } from '$lib/types/scene';

	let step = $state<SceneStep>('initial');
	let language: Language = $state('kr');
	let isPlaying = $state(false);
	let currentAudioURL: string | null = $state(null);
	let currentAudio: HTMLAudioElement | null = $state(null);
	let showFeedback = $state<string | null>(null);

	// Words for each character
	const characterWords: Record<string, { kr: string; en: string }> = {
		tiger: { kr: '호랑이', en: 'Tiger' },
		riceCake: { kr: '떡', en: 'Rice cake' },
		mother: { kr: '어머니', en: 'Mother' }
	};

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	async function playWordAudio(character: keyof typeof characterWords) {
		if (isPlaying) return;

		const word = characterWords[character];
		const text = language === 'kr' ? word.kr : word.en;

		let wasNarrationPaused = false;

		try {
			isPlaying = true;
			showFeedback = character;

			if (currentAudioURL) {
				revokeAudioURL(currentAudioURL);
				currentAudioURL = null;
			}

			if (currentAudio) {
				currentAudio.pause();
				currentAudio = null;
			}

			if (get(narrationPlaying)) {
				pauseNarration();
				wasNarrationPaused = true;
			}

			const audioURL = await getAudioForText(text, language);
			currentAudioURL = audioURL;

			const audio = new Audio(audioURL);
			currentAudio = audio;

			audio.addEventListener('ended', () => {
				isPlaying = false;
				showFeedback = null;
				if (wasNarrationPaused) {
					const el = get(narrationElement);
					if (el) el.play();
				}
			});

			audio.addEventListener('error', () => {
				console.error('Error playing word audio');
				isPlaying = false;
				showFeedback = null;
				if (wasNarrationPaused) {
					const el = get(narrationElement);
					if (el) el.play();
				}
			});

			await audio.play();
		} catch (err) {
			console.error('Failed to play word audio:', err);
			isPlaying = false;
			showFeedback = null;
			if (wasNarrationPaused) {
				const el = get(narrationElement);
				if (el) el.play();
			}
		}
	}

	function handleTigerClick(e: PointerEvent) {
		e.stopPropagation();
		playWordAudio('tiger');
	}

	function handleRiceCakeClick(e: PointerEvent) {
		e.stopPropagation();
		playWordAudio('riceCake');
	}

	// Only show zones when tiger is visible (after initial step) and not during rice cake interaction
	const showTigerZone = $derived(step !== 'initial' && step !== 'riceCakeVisible');
	// Don't show rice cake zone during interaction - it would interfere with dragging
	// Users can learn by dragging the actual rice cake
	const showRiceCakeZone = $derived(false);

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeLang();
		if (currentAudio) {
			currentAudio.pause();
			currentAudio = null;
		}
		if (currentAudioURL) {
			revokeAudioURL(currentAudioURL);
		}
	});
</script>

<!-- Tiger click zone - positioned on the right half of screen -->
{#if showTigerZone}
	<button
		class="character-zone tiger-zone"
		class:active={showFeedback === 'tiger'}
		onclick={(e) => handleTigerClick(e as unknown as PointerEvent)}
		aria-label={language === 'kr' ? '호랑이 - 클릭하면 단어를 읽어줘요' : 'Tiger - click to hear the word'}
	>
		{#if showFeedback === 'tiger'}
			<span class="feedback-text">{language === 'kr' ? '호랑이' : 'Tiger'}</span>
		{/if}
	</button>
{/if}

<!-- Rice cake learning zone - shows text popup when clicked -->
{#if showRiceCakeZone}
	<button
		class="character-zone ricecake-zone"
		class:active={showFeedback === 'riceCake'}
		onclick={(e) => handleRiceCakeClick(e as unknown as PointerEvent)}
		aria-label={language === 'kr' ? '떡 - 클릭하면 단어를 읽어줘요' : 'Rice cake - click to hear the word'}
	>
		{#if showFeedback === 'riceCake'}
			<span class="feedback-text">{language === 'kr' ? '떡' : 'Rice cake'}</span>
		{/if}
	</button>
{/if}

<style>
	.character-zone {
		position: fixed;
		border: none;
		background: transparent;
		cursor: pointer;
		z-index: 50;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.character-zone:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.character-zone.active {
		background: rgba(255, 200, 0, 0.2);
	}

	.tiger-zone {
		/* Position on the right side where the tiger is in the video */
		right: 5%;
		top: 20%;
		width: 40%;
		height: 60%;
		border-radius: 16px;
	}

	.ricecake-zone {
		/* Position on the left side where rice cakes are shown */
		left: 5%;
		bottom: 25%;
		width: 25%;
		height: 30%;
		border-radius: 12px;
	}

	.feedback-text {
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		color: #333;
		font-size: 2rem;
		font-weight: 700;
		padding: 16px 32px;
		border-radius: 16px;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		animation: popIn 0.3s ease-out;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	@keyframes popIn {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@media (max-width: 768px) {
		.tiger-zone {
			right: 0;
			width: 50%;
		}

		.ricecake-zone {
			left: 0;
			width: 35%;
		}

		.feedback-text {
			font-size: 1.5rem;
			padding: 12px 24px;
		}
	}
</style>
