<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentStep, nextStep, goToStep } from '$lib/stores/stepStore';
	import { triggerSceneEvent } from '$lib/stores/sceneStore';
	import { languageStore } from '$lib/stores/languageStore';
	import BookIntroThree from '$lib/components/ui/BookIntroThree.svelte';
	import type { SceneStep } from '$lib/stores/stepStore';
	import type { Language } from '$lib/types/scene';

	let step = $state<SceneStep>('initial');
	let language: Language = $state('kr');
	let isOpeningBook = $state(false);
	let hasOpenedBook = $state(false);
	let hasEnteredStory = $state(false);
	let blackOverlayActive = $state(false);
	let isClosingBook = $state(false);
	let closingTimers: number[] = [];

	const unsubscribeStep = currentStep.subscribe((s) => {
		const previousStep = step;
		step = s;

		if (s === 'initial' && previousStep !== 'initial' && !isClosingBook) {
			isOpeningBook = false;
			hasOpenedBook = false;
			hasEnteredStory = false;
			blackOverlayActive = false;
		}

		if (s === 'complete' && previousStep !== 'complete') {
			startClosingSequence();
		}
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	function handleBookClick() {
		if (isOpeningBook || isClosingBook) return;
		isOpeningBook = true;
		hasEnteredStory = false;

		const prefersReducedMotion =
			typeof window !== 'undefined' &&
			window.matchMedia &&
			window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		if (prefersReducedMotion) {
			hasOpenedBook = true;
			blackOverlayActive = true;
			setTimeout(() => {
				enterStory();
				setTimeout(() => {
					blackOverlayActive = false;
				}, 200);
			}, 120);
			return;
		}

		setTimeout(() => {
			enterStory();
		}, 3800);
	}

	function enterStory() {
		if (hasEnteredStory || step !== 'initial') return;
		hasEnteredStory = true;
		nextStep();
		triggerSceneEvent('tigerAppears');
	}

	function handleThreeComplete() {
		hasOpenedBook = true;
		blackOverlayActive = true;

		setTimeout(() => {
			enterStory();
			setTimeout(() => {
				blackOverlayActive = false;
			}, 200);
		}, 450);
	}

	function startClosingSequence() {
		clearClosingTimers();

		closingTimers.push(
			window.setTimeout(() => {
				blackOverlayActive = true;
			}, 2000),
			window.setTimeout(() => {
				isClosingBook = true;
				isOpeningBook = false;
				hasOpenedBook = false;
			}, 2500),
			window.setTimeout(() => {
				blackOverlayActive = false;
			}, 2700)
		);
	}

	function handleThreeClose() {
		isClosingBook = false;
		isOpeningBook = false;
		hasOpenedBook = false;
		hasEnteredStory = false;
		goToStep('initial');
	}

	function clearClosingTimers() {
		closingTimers.forEach((id) => clearTimeout(id));
		closingTimers = [];
	}

	onMount(() => {
		isOpeningBook = false;
		hasOpenedBook = false;
		hasEnteredStory = false;
		blackOverlayActive = false;
		isClosingBook = false;
	});

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeLang();
		clearClosingTimers();
	});

	const showIntro = $derived(step === 'initial' || isClosingBook);
</script>

{#if showIntro}
	<div class="intro-container">
		<div class="book-overlay">
			{#if !isClosingBook}
				<div class="click-hint" class:hidden={isOpeningBook}>
					<span>{language === 'kr' ? '클릭하여 열기' : 'Click to open'}</span>
				</div>
			{/if}
			<div class="book-stage" class:opened={hasOpenedBook}>
				<BookIntroThree
					opening={isOpeningBook}
					closing={isClosingBook}
					onComplete={handleThreeComplete}
					onClose={handleThreeClose}
					onClick={handleBookClick}
				/>
			</div>
		</div>
	</div>
{/if}

<div class="black-overlay" class:active={blackOverlayActive}></div>

<style>
	.intro-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 1000;
		background: #000;
	}

	.book-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: radial-gradient(circle at 50% 45%, rgba(80, 50, 25, 0.25) 0%, rgba(0, 0, 0, 0.6) 65%);
		z-index: 10;
	}

	.book-stage {
		display: grid;
		place-items: center;
		z-index: 11;
		transition: opacity 0.35s ease;
	}

	.book-stage.opened {
		opacity: 0;
	}

	.click-hint {
		position: absolute;
		top: 16%;
		left: 50%;
		transform: translateX(-50%);
		z-index: 12;
		animation: hint-float 2.8s ease-in-out infinite;
		transition: opacity 0.35s ease;
		pointer-events: none;
	}

	.click-hint.hidden {
		opacity: 0;
	}

	.click-hint span {
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
		font-size: 1.15rem;
		font-weight: 500;
		color: rgba(255, 235, 200, 0.8);
		letter-spacing: 0.06em;
		text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6);
		white-space: nowrap;
	}

	@keyframes hint-float {
		0%, 100% {
			transform: translateX(-50%) translateY(0);
		}
		50% {
			transform: translateX(-50%) translateY(-10px);
		}
	}

	.black-overlay {
		position: fixed;
		inset: 0;
		background: #000;
		z-index: 2000;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.6s ease;
	}

	.black-overlay.active {
		opacity: 1;
		transition: opacity 0.4s ease;
	}

	@media (prefers-reduced-motion: reduce) {
		.book-stage {
			transition: none;
		}
		.black-overlay {
			transition: none;
		}
		.click-hint {
			animation: none;
		}
	}

	@media (max-width: 768px) {
		.click-hint span {
			font-size: 1rem;
		}
	}
</style>
