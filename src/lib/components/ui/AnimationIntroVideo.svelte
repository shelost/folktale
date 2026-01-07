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
	let showVideo = $state(true); // Show video by default (as background)
	let hasStarted = $state(false);
	let videoPlaying = $state(false);

	const unsubscribeStep = currentStep.subscribe((s) => {
		const previousStep = step;
		step = s;
		
		// Reset if navigating back to initial
		if (s === 'initial' && previousStep !== 'initial') {
			hasStarted = false;
			showVideo = true; // Always show video as background
			if (videoElement) {
				videoElement.currentTime = 0;
				videoElement.play().catch((error) => {
					console.error('Error playing intro video:', error);
				});
			}
		} else if (s === 'initial') {
			// On initial step, show video as background and play it
			showVideo = true;
			if (videoElement && !videoPlaying) {
				videoElement.play().catch((error) => {
					console.error('Error playing intro video:', error);
				});
			}
		}
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	function handlePlayClick() {
		hasStarted = true;
		showVideo = true; // Video is already visible and playing
		
		// When play button is clicked, advance to next step immediately
		// Video is already playing in the background
		nextStep();
		triggerSceneEvent('tigerAppears');
	}

	function handleVideoEnded() {
		// Video loops, so this won't be called unless loop is disabled
		// But if it does end, don't auto-advance (user must click play button)
	}

	function handleVideoLoaded() {
		// Video loaded - start playing automatically
		if (videoElement && step === 'initial') {
			videoElement.currentTime = 0;
			videoElement.play().catch((error) => {
				console.error('Error auto-playing intro video:', error);
				// If autoplay fails (e.g., browser policy), try muted autoplay as fallback
				if (error.name === 'NotAllowedError') {
					videoElement.muted = true;
					videoElement.play().then(() => {
						videoPlaying = true;
						// Unmute after it starts playing
						setTimeout(() => {
							if (videoElement) {
								videoElement.muted = false;
							}
						}, 500);
					}).catch((mutedError) => {
						console.error('Error playing muted video:', mutedError);
					});
				}
			}).then(() => {
				videoPlaying = true;
				// Unmute after video starts (if it was muted for autoplay)
				setTimeout(() => {
					if (videoElement) {
						videoElement.muted = false;
					}
				}, 500);
			});
		}
	}

	onMount(() => {
		showVideo = true; // Show video by default as background
		hasStarted = false; // Play button hasn't been clicked yet
		videoPlaying = false; // Will be set to true when video starts playing
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
			<!-- Play button overlay with title -->
			<div class="play-button-overlay">
				<div class="title-container">
					<img src="/haetnim.png" alt="햇님달님" class="title-image">
				</div>
				<button class="play-button" onpointerdown={handlePlayClick} aria-label={language === 'kr' ? '시작하기' : 'Start'}>
					<span class="play-icon">▶</span>
					<span class="play-text">{language === 'kr' ? '시작하기' : 'Start'}</span>
				</button>
			</div>
		{/if}
		
		<!-- Video player (always visible as background, paused until play button is clicked) -->
		<div class="intro-video-container">
			<video
				bind:this={videoElement}
				src="/mountains.mp4"
				class="intro-video"
				autoplay
				playsinline
				loop
				onended={handleVideoEnded}
				onloadeddata={handleVideoLoaded}
			/>
		</div>
	</div>
{/if}

<style>

	.title-image{
		height: 360px;
	}

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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.7);
		gap: 40px;
		z-index: 10; /* Above the video */
	}

	.title-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.story-title {
		font-size: 4rem;
		font-weight: 900;
		color: #ffce00;
		text-shadow: 
			3px 3px 0px #000,
			-1px -1px 0px #000,
			1px -1px 0px #000,
			-1px 1px 0px #000,
			0 0 20px rgba(255, 206, 0, 0.5);
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		letter-spacing: 0.05em;
		animation: titleGlow 2s ease-in-out infinite;
	}

	@keyframes titleGlow {
		0%, 100% {
			text-shadow: 
				3px 3px 0px #000,
				-1px -1px 0px #000,
				1px -1px 0px #000,
				-1px 1px 0px #000,
				0 0 20px rgba(255, 206, 0, 0.5);
		}
		50% {
			text-shadow: 
				3px 3px 0px #000,
				-1px -1px 0px #000,
				1px -1px 0px #000,
				-1px 1px 0px #000,
				0 0 30px rgba(255, 206, 0, 0.8);
		}
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
		z-index: 1; /* Below the play button overlay */
	}

	.intro-video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}


	@media (max-width: 768px) {
		.story-title {
			font-size: 2.5rem;
		}
		
		.play-button {
			font-size: 24px;
			padding: 20px 40px;
		}
	}
</style>

