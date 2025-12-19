<script lang="ts">
	import { languageStore, toggleLanguage } from '$lib/stores/languageStore';
	import type { Language } from '$lib/types/scene';

	let language: Language = $state('kr');

	const unsubscribe = languageStore.subscribe((lang) => {
		language = lang;
	});

	function handleToggle() {
		toggleLanguage();
	}
</script>

<button class="language-toggle" onpointerdown={handleToggle} aria-label="Toggle language">
	<span class="language-label">{language === 'kr' ? '한국어' : 'English'}</span>
	<span class="language-icon">🌐</span>
</button>

<style>
	.language-toggle {
		position: fixed;
		top: 20px;
		right: 20px;
		background: rgba(255, 255, 255, 0.9);
		border: 2px solid #333;
		border-radius: 8px;
		padding: 8px 16px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		z-index: 200;
		transition: background-color 0.2s;
	}

	.language-toggle:hover {
		background: rgba(255, 255, 255, 1);
	}

	.language-toggle:active {
		transform: scale(0.95);
	}

	.language-label {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.language-icon {
		font-size: 1.2rem;
	}
</style>

