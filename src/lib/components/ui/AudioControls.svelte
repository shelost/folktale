<script lang="ts">
	import { audioPlaying, audioCurrentTime, createAudioElement, playAudio, pauseAudio } from '$lib/stores/audioStore';
	import { scene3Data } from '$lib/data/scene3';

	let audio: HTMLAudioElement | null = $state(null);
	let playing = $state(false);
	let audioReady = $state(false);
	let simulationInterval: number | null = $state(null);

	const unsubscribePlaying = audioPlaying.subscribe((isPlaying) => {
		playing = isPlaying;
	});

	function simulateAudioPlayback() {
		// Simulate audio playback for testing without audio file
		let currentTime = 0;
		const duration = 15; // 15 seconds based on last timing
		
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

	function handlePlayPause() {
		if (playing) {
			// Pause
			if (audio) {
				pauseAudio(audio);
			} else if (simulationInterval) {
				// Pause simulation
				clearInterval(simulationInterval);
				simulationInterval = null;
			}
			audioPlaying.set(false);
		} else {
			// Play
			if (scene3Data.audio.url) {
				// Use real audio file if available
				if (!audio) {
					audio = createAudioElement(scene3Data.audio.url);
					audio.addEventListener('canplay', () => {
						audioReady = true;
					});
					audio.addEventListener('error', (e) => {
						console.error('Audio error:', e);
						console.log('Falling back to simulated audio playback');
						// Fall back to simulation if audio file fails
						audio = null;
						simulateAudioPlayback();
						audioPlaying.set(true);
					});
				}
				if (audio) {
					playAudio(audio);
				}
			} else {
				// No audio file, simulate playback
				console.log('No audio file provided, simulating playback for scene progression');
				simulateAudioPlayback();
				audioPlaying.set(true);
			}
		}
	}
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

