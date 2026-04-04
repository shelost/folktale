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
		background: linear-gradient(180deg, var(--storybook-paper) 0%, var(--storybook-paper-dark) 100%);
		border: 2px solid var(--storybook-border);
		border-radius: 999px;
		padding: 8px 16px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		color: var(--storybook-ink);
		display: flex;
		align-items: center;
		gap: 8px;
		z-index: 1100;
		transition: background-color 0.2s, transform 0.2s ease;
		box-shadow: 0 4px 10px rgba(38, 23, 10, 0.25);
	}

	.language-toggle:hover {
		background: linear-gradient(180deg, #f7ecd4 0%, #e9d8b5 100%);
		transform: translateY(-1px);
	}

	.language-toggle:active {
		transform: scale(0.95);
	}

	.language-label {
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
		letter-spacing: 0.01em;
	}

	.language-icon {
		font-size: 1.2rem;
	}
</style>

