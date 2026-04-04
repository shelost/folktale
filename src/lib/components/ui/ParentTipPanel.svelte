<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { languageStore } from '$lib/stores/languageStore';
	import { currentStep, type SceneStep } from '$lib/stores/stepStore';
	import { sceneStore } from '$lib/stores/sceneStore';
	import type { Language, ParentTip, SceneState } from '$lib/types/scene';

	let {
		tips,
		mode,
		showDuringIntro = false
	}: {
		tips: ParentTip[];
		mode: 'scene3' | 'animation';
		/** When true (animation only), FAB stays available on the intro step so parents can read tips early */
		showDuringIntro?: boolean;
	} = $props();

	let language: Language = $state('kr');
	let step = $state<SceneStep>(get(currentStep));
	let scene: SceneState | null = $state(null);

	let showTip = $state(get(currentStep) !== 'initial');
	let isExpanded = $state(false);
	let currentIndex = $state(0);

	function tipMatchesAnimation(tip: ParentTip, s: SceneStep): boolean {
		switch (tip.trigger) {
			case 'tigerSpeaks':
				return s === 'tigerAppears' || s === 'motherFalls';
			case 'motherWalking':
				/* Intro often shows the mother / mountain setup; same beat as the Jeong prompt */
				return s === 'initial' || s === 'tigerAppears';
			case 'riceCakeVisible':
				return s === 'riceCakeVisible';
			default:
				return false;
		}
	}

	function tipMatchesScene3(tip: ParentTip, s: SceneStep, st: SceneState): boolean {
		switch (tip.trigger) {
			case 'tigerSpeaks':
				return st.characters.tiger.animationState === 'speaking';
			case 'motherWalking':
				return s === 'tigerAppears';
			case 'riceCakeVisible':
				return s === 'riceCakeVisible';
			default:
				return false;
		}
	}

	function firstRecommendedIndex(
		sceneMode: 'scene3' | 'animation',
		sceneOverride?: SceneState | null
	): number {
		if (tips.length === 0) return 0;
		if (sceneMode === 'animation') {
			const idx = tips.findIndex((t) => tipMatchesAnimation(t, step));
			return idx >= 0 ? idx : 0;
		}
		const st = sceneOverride ?? scene;
		if (!st) return 0;
		const idx = tips.findIndex((t) => tipMatchesScene3(t, step, st));
		return idx >= 0 ? idx : 0;
	}

	const isRecommended = $derived.by(() => {
		const t = tips[currentIndex];
		if (!t) return false;
		if (mode === 'animation') return tipMatchesAnimation(t, step);
		if (!scene) return false;
		return tipMatchesScene3(t, step, scene);
	});

	const current = $derived(tips[currentIndex] ?? null);

	onMount(() => {
		const sceneMode = mode;
		const allowTipsOnIntro = sceneMode === 'animation' && showDuringIntro;

		if (sceneMode === 'scene3') {
			scene = get(sceneStore);
		}

		if (allowTipsOnIntro || get(currentStep) !== 'initial') {
			showTip = true;
			currentIndex = firstRecommendedIndex(
				sceneMode,
				sceneMode === 'scene3' ? get(sceneStore) : null
			);
		}

		const unsubLang = languageStore.subscribe((lang) => {
			language = lang;
		});

		const unsubStep = currentStep.subscribe((s) => {
			step = s;
			showTip = allowTipsOnIntro || s !== 'initial';
			if (showTip) {
				currentIndex = firstRecommendedIndex(sceneMode);
			}
		});

		let unsubScene: (() => void) | undefined;
		if (sceneMode === 'scene3') {
			unsubScene = sceneStore.subscribe((st) => {
				scene = st;
				if (step !== 'initial' && showTip) {
					currentIndex = firstRecommendedIndex(sceneMode, st);
				}
			});
		}

		return () => {
			unsubLang();
			unsubStep();
			unsubScene?.();
		};
	});

	function toggleTip() {
		isExpanded = !isExpanded;
	}

	function closeTip() {
		isExpanded = false;
	}

	function prevTip() {
		if (tips.length === 0) return;
		currentIndex = (currentIndex - 1 + tips.length) % tips.length;
	}

	function nextTip() {
		if (tips.length === 0) return;
		currentIndex = (currentIndex + 1) % tips.length;
	}

	function goToIndex(i: number) {
		currentIndex = i;
	}
</script>

{#if showTip && tips.length > 0 && current}
	<div class="parent-tip-fab" class:expanded={isExpanded} role="region" aria-label="Parent Tip">
		{#if isExpanded}
			<div class="parent-tip-content">
				<div class="parent-tip-header">
					<span class="parent-tip-icon">💡</span>
					<h3 class="parent-tip-title">
						{language === 'kr' ? '부모 팁' : 'Parent Tip'}
					</h3>
				</div>

				{#if isRecommended}
					<p class="parent-tip-badge">
						{language === 'kr' ? '이 순간에 추천' : 'Suggested for this moment'}
					</p>
				{/if}

				<p class="parent-tip-text">{current.text[language]}</p>

				{#if current.description}
					<p class="parent-tip-purpose-label">
						{language === 'kr' ? '목적' : 'Purpose'}
					</p>
					<p class="parent-tip-purpose">{current.description[language]}</p>
				{/if}

				<div class="parent-tip-nav" aria-label={language === 'kr' ? '팁 탐색' : 'Browse tips'}>
					<button
						type="button"
						class="parent-tip-nav-btn"
						onpointerdown={prevTip}
						aria-label={language === 'kr' ? '이전 팁' : 'Previous tip'}
					>
						‹
					</button>
					<div class="parent-tip-dots">
						{#each tips as _, i}
							<button
								type="button"
								class="parent-tip-dot"
								class:active={i === currentIndex}
								onpointerdown={() => goToIndex(i)}
								aria-label={language === 'kr' ? `팁 ${i + 1}` : `Tip ${i + 1}`}
							></button>
						{/each}
					</div>
					<button
						type="button"
						class="parent-tip-nav-btn"
						onpointerdown={nextTip}
						aria-label={language === 'kr' ? '다음 팁' : 'Next tip'}
					>
						›
					</button>
				</div>

				<p class="parent-tip-counter">
					{currentIndex + 1} / {tips.length}
				</p>

				<button class="parent-tip-close" onpointerdown={closeTip} aria-label="Close tip">
					{language === 'kr' ? '닫기' : 'Close'}
				</button>
			</div>
		{:else}
			<button class="parent-tip-fab-button" onpointerdown={toggleTip} aria-label="Show parent tip">
				<span class="parent-tip-fab-icon">💡</span>
			</button>
		{/if}
	</div>
{/if}

<style>
	.parent-tip-fab {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 1100;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}

	.parent-tip-fab-button {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: linear-gradient(180deg, var(--storybook-paper) 0%, var(--storybook-paper-dark) 100%);
		border: 3px solid var(--storybook-border);
		box-shadow: 0 4px 20px rgba(38, 23, 10, 0.35);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		padding: 0;
		margin: 0;
		animation: slideInFromRight 0.5s ease-out;
	}

	.parent-tip-fab-button:hover {
		transform: scale(1.1);
		box-shadow: 0 6px 24px rgba(0, 0, 0, 0.4);
	}

	.parent-tip-fab-button:active {
		transform: scale(0.95);
	}

	.parent-tip-fab-icon {
		font-size: 2rem;
		line-height: 1;
	}

	.parent-tip-fab.expanded .parent-tip-content {
		animation: expandTip 0.3s ease-out;
	}

	.parent-tip-content {
		background: linear-gradient(180deg, var(--storybook-paper) 0%, #ead7b1 100%);
		border: 3px solid var(--storybook-border);
		border-radius: 12px;
		padding: 20px;
		max-width: 420px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		position: relative;
		min-width: 300px;
	}

	.parent-tip-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 8px;
	}

	.parent-tip-icon {
		font-size: 1.5rem;
	}

	.parent-tip-title {
		margin: 0;
		font-size: 1.2rem;
		font-weight: bold;
		color: var(--storybook-ink);
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
	}

	.parent-tip-badge {
		margin: 0 0 10px 0;
		font-size: 0.75rem;
		font-weight: 600;
		color: #2d5016;
		background: rgba(45, 80, 22, 0.12);
		padding: 4px 10px;
		border-radius: 999px;
		display: inline-block;
	}

	.parent-tip-text {
		margin: 0 0 12px 0;
		color: #3d2b1a;
		line-height: 1.6;
		font-size: 1rem;
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
	}

	.parent-tip-purpose-label {
		margin: 0 0 4px 0;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #8b4513;
		opacity: 0.85;
	}

	.parent-tip-purpose {
		margin: 0 0 16px 0;
		color: #666;
		line-height: 1.55;
		font-size: 0.9rem;
	}

	.parent-tip-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin-bottom: 8px;
	}

	.parent-tip-nav-btn {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 8px;
		border: 2px solid var(--storybook-border);
		background: #f7ecd2;
		color: var(--storybook-ink);
		font-size: 1.4rem;
		line-height: 1;
		cursor: pointer;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.parent-tip-nav-btn:hover {
		background: #efe0bc;
	}

	.parent-tip-dots {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 6px;
		flex: 1;
	}

	.parent-tip-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: none;
		background: rgba(139, 69, 19, 0.25);
		cursor: pointer;
		padding: 0;
	}

	.parent-tip-dot.active {
		background: var(--storybook-accent);
		transform: scale(1.15);
	}

	.parent-tip-counter {
		margin: 0 0 12px 0;
		text-align: center;
		font-size: 0.8rem;
		color: #777;
	}

	.parent-tip-close {
		width: 100%;
		background: var(--storybook-accent);
		color: #f9ecd4;
		border: 1px solid #5b1f13;
		border-radius: 6px;
		padding: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background-color 0.2s;
	}

	.parent-tip-close:hover {
		background: #8a3a28;
	}

	@keyframes slideInFromRight {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes expandTip {
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
		.parent-tip-content {
			max-width: calc(100vw - 40px);
			min-width: 280px;
		}

		.parent-tip-fab {
			bottom: 16px;
			right: 16px;
		}

		.parent-tip-fab-button {
			width: 56px;
			height: 56px;
		}

		.parent-tip-fab-icon {
			font-size: 1.75rem;
		}
	}
</style>
