<script lang="ts">
	import { languageStore } from '$lib/stores/languageStore';
	import { animationData } from '$lib/data/animation';
	import type { Language } from '$lib/types/scene';

	let language: Language = $state('kr');
	let showDictionary = $state(false);
	let selectedTerm: string | null = $state(null);

	const unsubscribe = languageStore.subscribe((lang) => {
		language = lang;
	});

	function toggleDictionary() {
		showDictionary = !showDictionary;
		if (!showDictionary) {
			selectedTerm = null;
		}
	}

	function selectTerm(term: string) {
		selectedTerm = selectedTerm === term ? null : term;
	}

	function getDefinition(term: string) {
		const entry = animationData.culturalDictionary.find((e) => e.term === term);
		return entry ? entry.definition[language] : '';
	}
</script>

<button
	class="dictionary-toggle"
	onpointerdown={toggleDictionary}
	aria-label="Cultural dictionary"
	title="Cultural dictionary"
>
	📚
</button>

{#if showDictionary}
	<div class="dictionary-overlay" role="dialog" aria-label="Cultural Dictionary">
		<div class="dictionary-content">
			<h2 class="dictionary-title">
				{language === 'kr' ? '문화 사전' : 'Cultural Dictionary'}
			</h2>
			<ul class="dictionary-list">
				{#each animationData.culturalDictionary as entry}
					<li class="dictionary-item">
						<button
							class="dictionary-term"
							class:active={selectedTerm === entry.term}
							onpointerdown={() => selectTerm(entry.term)}
						>
							<strong>{entry.term}</strong>
						</button>
						{#if selectedTerm === entry.term}
							<p class="dictionary-definition">{entry.definition[language]}</p>
						{/if}
					</li>
				{/each}
			</ul>
			<button class="dictionary-close" onpointerdown={toggleDictionary}>
				{language === 'kr' ? '닫기' : 'Close'}
			</button>
		</div>
	</div>
{/if}

<style>
	.dictionary-toggle {
		position: fixed;
		top: 20px;
		left: 20px;
		background: rgba(255, 255, 255, 0.9);
		border: 2px solid #333;
		border-radius: 8px;
		padding: 8px 12px;
		cursor: pointer;
		font-size: 1.5rem;
		z-index: 200;
		transition: transform 0.2s, background-color 0.2s;
	}

	.dictionary-toggle:hover {
		background: rgba(255, 255, 255, 1);
		transform: scale(1.1);
	}

	.dictionary-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 300;
	}

	.dictionary-content {
		background: white;
		border-radius: 12px;
		padding: 24px;
		max-width: 500px;
		max-height: 80vh;
		overflow-y: auto;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
	}

	.dictionary-title {
		margin: 0 0 16px 0;
		font-size: 1.5rem;
		font-weight: bold;
		color: #333;
	}

	.dictionary-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.dictionary-item {
		margin-bottom: 16px;
	}

	.dictionary-term {
		width: 100%;
		text-align: left;
		background: #f5f5f5;
		border: 2px solid #ddd;
		border-radius: 6px;
		padding: 12px;
		cursor: pointer;
		font-size: 1.1rem;
		transition: background-color 0.2s, border-color 0.2s;
	}

	.dictionary-term:hover {
		background: #e8e8e8;
	}

	.dictionary-term.active {
		background: #fff8dc;
		border-color: #d4a574;
	}

	.dictionary-definition {
		margin: 8px 0 0 0;
		padding: 12px;
		background: #f9f9f9;
		border-radius: 6px;
		color: #555;
		line-height: 1.6;
	}

	.dictionary-close {
		margin-top: 16px;
		width: 100%;
		background: #333;
		color: white;
		border: none;
		border-radius: 6px;
		padding: 12px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: background-color 0.2s;
	}

	.dictionary-close:hover {
		background: #555;
	}
</style>

