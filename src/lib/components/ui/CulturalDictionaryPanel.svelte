<script lang="ts">
	import { onDestroy } from 'svelte';
	import { languageStore } from '$lib/stores/languageStore';
	import type { CulturalDictionaryEntry, Language } from '$lib/types/scene';

	let {
		entries
	}: {
		entries: CulturalDictionaryEntry[];
	} = $props();

	let language: Language = $state('kr');
	let showDictionary = $state(false);

	const unsubscribe = languageStore.subscribe((lang) => {
		language = lang;
	});

	function toggleDictionary() {
		showDictionary = !showDictionary;
	}

	onDestroy(() => {
		unsubscribe();
	});
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
			<h2 class="dictionary-title" id="dictionary-dialog-title">
				{language === 'kr' ? '문화 사전' : 'Cultural Dictionary'}
			</h2>
			<div class="dictionary-scroll">
				<ul class="dictionary-list" aria-labelledby="dictionary-dialog-title">
					{#each entries as entry}
						<li class="dictionary-item">
							<article class="dictionary-card">
								<h3 class="dictionary-term-heading">
									{entry.term}
								</h3>
								<div class="dictionary-detail">
									{#if entry.image}
										<img
											class="dictionary-image"
											src={entry.image}
											alt=""
											role="presentation"
										/>
									{/if}
									<p class="dictionary-definition">{entry.definition[language]}</p>
								</div>
							</article>
						</li>
					{/each}
				</ul>
			</div>
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
		background: linear-gradient(180deg, var(--storybook-paper) 0%, var(--storybook-paper-dark) 100%);
		border: 2px solid var(--storybook-border);
		border-radius: 999px;
		padding: 8px 12px;
		cursor: pointer;
		font-size: 1.5rem;
		z-index: 200;
		transition:
			transform 0.2s,
			background-color 0.2s;
		box-shadow: 0 4px 10px rgba(38, 23, 10, 0.25);
	}

	.dictionary-toggle:hover {
		background: linear-gradient(180deg, #f7ecd4 0%, #e9d8b5 100%);
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
		padding: 16px;
		box-sizing: border-box;
	}

	.dictionary-content {
		display: flex;
		flex-direction: column;
		width: min(500px, calc(100vw - 32px));
		height: min(560px, 80vh);
		max-height: 80vh;
		background: linear-gradient(180deg, var(--storybook-paper) 0%, #efe0bd 100%);
		border-radius: 12px;
		border: 2px solid var(--storybook-border);
		padding: 24px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
		box-sizing: border-box;
		overflow: hidden;
	}

	.dictionary-title {
		flex-shrink: 0;
		margin: 0 0 16px 0;
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--storybook-ink);
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
	}

	.dictionary-scroll {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		-webkit-overflow-scrolling: touch;
		margin: 0 -4px;
		padding: 0 4px;
	}

	.dictionary-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.dictionary-item {
		margin-bottom: 16px;
	}

	.dictionary-item:last-child {
		margin-bottom: 4px;
	}

	.dictionary-card {
		border: 2px solid var(--storybook-border);
		border-radius: 8px;
		overflow: hidden;
		background: #f8edd3;
	}

	.dictionary-term-heading {
		margin: 0;
		padding: 12px 14px;
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--storybook-ink);
		background: #efe0bb;
		border-bottom: 2px solid var(--storybook-border);
	}

	.dictionary-detail {
		padding: 12px 14px 14px;
		background: #fbf3df;
	}

	.dictionary-image {
		display: block;
		max-height: 120px;
		width: auto;
		max-width: 100%;
		margin: 0 auto 12px auto;
		object-fit: contain;
		border-radius: 8px;
		border: 1px solid #e0e0e0;
	}

	.dictionary-definition {
		margin: 0;
		padding: 12px;
		background: #f6ebd2;
		border-radius: 6px;
		color: #4c3722;
		line-height: 1.6;
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
	}

	.dictionary-close {
		flex-shrink: 0;
		margin-top: 16px;
		width: 100%;
		background: var(--storybook-accent);
		color: #f9ecd4;
		border: 1px solid #5b1f13;
		border-radius: 6px;
		padding: 12px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		transition: background-color 0.2s;
	}

	.dictionary-close:hover {
		background: #8a3a28;
	}
</style>
