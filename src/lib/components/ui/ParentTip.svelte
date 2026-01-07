<script lang="ts">
	import { languageStore } from '$lib/stores/languageStore';
	import { sceneStore } from '$lib/stores/sceneStore';
	import { scene3Data } from '$lib/data/scene3';
	import type { Language } from '$lib/types/scene';

	let language: Language = $state('kr');
	let scene = $state<any>(null);
	let showTip = $state(false);
	let currentTip = $state<string | null>(null);
	let isExpanded = $state(false);

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	const unsubscribeScene = sceneStore.subscribe((state) => {
		scene = state;
		
		// Show tip when tiger speaks - stays visible until closed
		if (state.characters.tiger.animationState === 'speaking' && !showTip) {
			const tip = scene3Data.parentTips.find((t) => t.trigger === 'tigerSpeaks');
			if (tip) {
				currentTip = tip.text[language];
				showTip = true;
				isExpanded = false; // Start collapsed
			}
		}
	});

	function toggleTip() {
		isExpanded = !isExpanded;
	}

	function closeTip() {
		isExpanded = false;
	}
</script>

{#if showTip && currentTip}
	<div class="parent-tip-fab" class:expanded={isExpanded} role="region" aria-label="Parent Tip">
		{#if isExpanded}
			<div class="parent-tip-content">
				<div class="parent-tip-header">
					<span class="parent-tip-icon">💡</span>
					<h3 class="parent-tip-title">
						{language === 'kr' ? '부모 팁' : 'Parent Tip'}
					</h3>
				</div>
				<p class="parent-tip-text">{currentTip}</p>
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
		z-index: 250;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}

	.parent-tip-fab-button {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		background: linear-gradient(135deg, #fff8dc 0%, #ffe4b5 100%);
		border: 3px solid #d4a574;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
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
		background: linear-gradient(135deg, #fff8dc 0%, #ffe4b5 100%);
		border: 3px solid #d4a574;
		border-radius: 12px;
		padding: 20px;
		max-width: 400px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		position: relative;
		min-width: 300px;
	}

	.parent-tip-header {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
	}

	.parent-tip-icon {
		font-size: 1.5rem;
	}

	.parent-tip-title {
		margin: 0;
		font-size: 1.2rem;
		font-weight: bold;
		color: #8b4513;
	}

	.parent-tip-text {
		margin: 0 0 16px 0;
		color: #555;
		line-height: 1.6;
		font-size: 1rem;
	}

	.parent-tip-close {
		width: 100%;
		background: #8b4513;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 8px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		transition: background-color 0.2s;
	}

	.parent-tip-close:hover {
		background: #a0522d;
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

