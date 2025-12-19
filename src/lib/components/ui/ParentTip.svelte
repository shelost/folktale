<script lang="ts">
	import { languageStore } from '$lib/stores/languageStore';
	import { sceneStore } from '$lib/stores/sceneStore';
	import { scene3Data } from '$lib/data/scene3';
	import type { Language } from '$lib/types/scene';

	let language: Language = $state('kr');
	let scene = $state<any>(null);
	let showTip = $state(false);
	let currentTip = $state<string | null>(null);

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
			}
		}
	});

	function closeTip() {
		showTip = false;
	}
</script>

{#if showTip && currentTip}
	<div class="parent-tip-overlay" role="region" aria-label="Parent Tip">
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
	</div>
{/if}

<style>
	.parent-tip-overlay {
		position: fixed;
		bottom: 20px;
		right: 20px;
		z-index: 250;
		animation: slideInFromRight 0.5s ease-out;
	}

	.parent-tip-content {
		background: linear-gradient(135deg, #fff8dc 0%, #ffe4b5 100%);
		border: 3px solid #d4a574;
		border-radius: 12px;
		padding: 20px;
		max-width: 400px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		position: relative;
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
</style>

