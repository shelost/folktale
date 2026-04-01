<script lang="ts">
	import { onDestroy } from 'svelte';
	import {
		audioPlaying,
		audioCurrentTime,
		createAudioElement,
		playAudio,
		pauseAudio,
		narrationPlaying,
		narrationElement,
		pauseNarration
	} from '$lib/stores/audioStore';
	import { scene3Data } from '$lib/data/scene3';
	import { get } from 'svelte/store';

	let { mode = 'scene3' }: { mode?: 'scene3' | 'narration' } = $props();

	let audio: HTMLAudioElement | null = $state(null);
	let playing = $state(false);
	let simulationInterval: number | null = $state(null);
	let isNarrationMode = $derived(mode === 'narration');

	const unsubscribeNarration = narrationPlaying.subscribe((v) => {
		if (isNarrationMode) playing = v;
	});

	const unsubscribeAudio = audioPlaying.subscribe((v) => {
		if (!isNarrationMode) playing = v;
	});

	function simulateAudioPlayback() {
		let currentTime = 0;
		const duration = 15;

		simulationInterval = setInterval(() => {
			currentTime += 0.1;
			audioCurrentTime.set(currentTime);

			if (currentTime >= duration) {
				audioPlaying.set(false);
				audioCurrentTime.set(0);
				if (simulationInterval) {
					clearInterval(simulationInterval);
					simulationInterval = null;
				}
			}
		}, 100) as unknown as number;
	}

	function handlePlayPauseNarration() {
		const el = get(narrationElement);
		if (playing) {
			pauseNarration();
		} else if (el) {
			el.play();
		}
	}

	function handlePlayPauseScene3() {
		if (playing) {
			if (audio) {
				pauseAudio(audio);
			} else if (simulationInterval) {
				clearInterval(simulationInterval);
				simulationInterval = null;
			}
			audioPlaying.set(false);
		} else {
			if (scene3Data.audio.url) {
				if (!audio) {
					audio = createAudioElement(scene3Data.audio.url);
					audio.addEventListener('canplay', () => {});
					audio.addEventListener('error', () => {
						audio = null;
						simulateAudioPlayback();
						audioPlaying.set(true);
					});
				}
				if (audio) {
					playAudio(audio);
				}
			} else {
				simulateAudioPlayback();
				audioPlaying.set(true);
			}
		}
	}

	function handlePlayPause() {
		if (mode === 'narration') {
			handlePlayPauseNarration();
		} else {
			handlePlayPauseScene3();
		}
	}

	onDestroy(() => {
		unsubscribeNarration();
		unsubscribeAudio();
	});
</script>

<button class="audio-control" onpointerdown={handlePlayPause} aria-label={playing ? 'Pause audio' : 'Play audio'}>
	<span class="audio-icon">{playing ? '⏸️' : '▶️'}</span>
</button>

<style>
	.audio-control {
		position: fixed;
		bottom: 20px;
		left: 20px;
		background: linear-gradient(180deg, var(--storybook-paper) 0%, var(--storybook-paper-dark) 100%);
		border: 2px solid var(--storybook-border);
		border-radius: 50%;
		width: 60px;
		height: 60px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		transition: transform 0.2s, background-color 0.2s;
		font-size: 1.5rem;
		box-shadow: 0 4px 10px rgba(38, 23, 10, 0.3);
	}

	.audio-control:hover {
		background: linear-gradient(180deg, #f7ecd4 0%, #e9d8b5 100%);
		transform: scale(1.1);
	}

	.audio-control:active {
		transform: scale(0.95);
	}

	.audio-icon {
		display: block;
	}
</style>
