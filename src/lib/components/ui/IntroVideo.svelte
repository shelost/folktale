<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentStep, nextStep } from '$lib/stores/stepStore';
	import { triggerSceneEvent } from '$lib/stores/sceneStore';
	import { languageStore } from '$lib/stores/languageStore';
	import type { SceneStep } from '$lib/stores/stepStore';
	import type { Language } from '$lib/types/scene';

	let step = $state<SceneStep>('initial');
	let language: Language = $state('kr');
	let videoElement: HTMLVideoElement | null = $state(null);
	let showVideo = $state(false);
	let hasStarted = $state(false);

	const unsubscribeStep = currentStep.subscribe((s) => {
		const previousStep = step;
		step = s;
		
		// Reset if navigating back to initial
		if (s === 'initial' && previousStep !== 'initial') {
			hasStarted = false;
			showVideo = false;
		} else {
			showVideo = s === 'initial' && hasStarted;
		}
		
		if (showVideo && videoElement && hasStarted) {
			// Reset and play video when step becomes 'initial' and user has started
			videoElement.currentTime = 0;
			videoElement.play().catch((error) => {
				console.error('Error playing intro video:', error);
			});
		}
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	function handlePlayClick() {
		hasStarted = true;
		showVideo = true;
		
		if (videoElement) {
			videoElement.play().catch((error) => {
				console.error('Error playing intro video:', error);
				// If autoplay fails (e.g., browser policy), try muted autoplay as fallback
				if (error.name === 'NotAllowedError') {
					videoElement.muted = true;
					videoElement.play().catch((mutedError) => {
						console.error('Error playing muted video:', mutedError);
					});
				}
			});
		}
	}

	function handleVideoEnded() {
		// Auto-advance to next step when video ends
		const nextStepValue = 'tigerAppears';
		nextStep();
		triggerSceneEvent('tigerAppears');
	}

	function handleVideoLoaded() {
		// Video loaded - will play when user clicks play button
	}

	onMount(() => {
		showVideo = false; // Don't show video until play button is clicked
		hasStarted = false;
	});

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeLang();
		if (videoElement) {
			videoElement.pause();
			videoElement = null;
		}
	});
</script>

{#if step === 'initial'}
	<div class="intro-container">
		{#if !hasStarted}
			<!-- Play button overlay -->
			<div class="play-button-overlay">
				<button class="play-button" onpointerdown={handlePlayClick} aria-label={language === 'kr' ? '시작하기' : 'Start'}>
					<span class="play-icon">▶</span>
					<span class="play-text">{language === 'kr' ? '시작하기' : 'Start'}</span>
				</button>
			</div>
		{/if}
		
		<!-- Video player (always present for binding, hidden when not playing) -->
		<div class="intro-video-container" class:hidden={!showVideo}>
			<video
				bind:this={videoElement}
				src="/korean_mother_mountain.mp4"
				class="intro-video"
				playsinline
				onended={handleVideoEnded}
				onloadeddata={handleVideoLoaded}
			/>
		</div>
	</div>
{/if}

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

	.play-button-overlay {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
	}

	.play-button {
		background: #ffce00;
		color: black;
		border: 4px solid black;
		border-radius: 80px;
		padding: 24px 48px;
		cursor: pointer;
		font-size: 32px;
		font-weight: 900;
		display: flex;
		align-items: center;
		gap: 16px;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.play-button:hover {
		transform: scale(1.1);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
	}

	.play-button:active {
		transform: scale(0.95);
	}

	.play-icon {
		font-size: 1.5em;
		line-height: 1;
	}

	.play-text {
		font-size: 1em;
	}

	.intro-video-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.intro-video-container.hidden {
		display: none;
	}

	.intro-video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>

