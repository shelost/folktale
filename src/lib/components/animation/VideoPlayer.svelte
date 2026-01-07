<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import type { SceneStep } from '$lib/stores/stepStore';

	let step = $state<SceneStep>('initial');
	let videoElement: HTMLVideoElement | null = $state(null);
	let currentVideoSrc = $state<string | null>(null);

	// Map steps to video files - all videos in consecutive order
	// Note: 'initial' step uses AnimationIntroVideo component with mountains.mp4
	const stepToVideoMap: Record<string, string> = {
		'tigerAppears': '/tiger_1.mp4',
		'motherFalls': '/tiger_2.mp4',
		'tigerSpeaks': '/tiger_3.mp4',
		'riceCakeVisible': '/tiger_4.mp4',
		'tigerEats': '/tiger_4.mp4', // Keep showing the last video
		'complete': '/tiger_4.mp4' // Keep showing the last video
	};

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
		const videoSrc = stepToVideoMap[s];
		
		if (videoSrc) {
			currentVideoSrc = videoSrc;
		} else {
			currentVideoSrc = null;
		}

		// Pause video for interaction step, but play for final step
		if (videoElement) {
			if (s === 'riceCakeVisible') {
				// Pause and show freeze frame - don't let it play during interaction
				videoElement.pause();
				// Prevent autoplay by removing autoplay attribute temporarily
				videoElement.removeAttribute('autoplay');
			} else if (s === 'tigerEats') {
				// Play the final video when rice cake is dropped
				videoElement.setAttribute('autoplay', '');
				videoElement.play().catch((error) => {
					console.error('Error playing final video:', error);
					// If autoplay fails, try muted autoplay as fallback
					if (error.name === 'NotAllowedError') {
						videoElement.muted = true;
						videoElement.play().catch((mutedError) => {
							console.error('Error playing muted final video:', mutedError);
						});
					}
				});
			} else if (s === 'complete') {
				// Keep video paused on complete step (story finished)
				videoElement.pause();
				videoElement.removeAttribute('autoplay');
			} else if (videoSrc && s !== 'riceCakeVisible' && s !== 'tigerEats' && s !== 'complete') {
				// Resume playing for other steps
				videoElement.setAttribute('autoplay', '');
				videoElement.play().catch((error) => {
					console.error('Error playing video:', error);
				});
			}
		}
	});

	function handleVideoEnded() {
		// Video ended - narration manager will handle advancement
		// Videos just play and stop, narration controls the flow
	}

	function handleVideoLoaded() {
		// Auto-play video when it's loaded, but NOT for interaction step
		// For tigerEats step, we want to play the video
		if (videoElement && currentVideoSrc) {
			if (step === 'riceCakeVisible' || step === 'complete') {
				// Pause for interaction and complete steps
				videoElement.pause();
			} else {
				// Play for other steps including tigerEats
				videoElement.play().catch((error) => {
					console.error('Error auto-playing video:', error);
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
	}

	function handleVideoSrcChange() {
		// When video src changes, reset and play (unless interaction step)
		if (videoElement && currentVideoSrc) {
			// Don't reset currentTime for tigerEats if it's the same video as riceCakeVisible
			// (they both use tiger_4.mp4, so we want to continue from where it paused)
			if (step !== 'tigerEats') {
				videoElement.currentTime = 0;
			}
			videoElement.load();
			// If interaction step, pause immediately after loading
			// For tigerEats, we want it to play
			if (step === 'riceCakeVisible' || step === 'complete') {
				videoElement.pause();
			}
		}
	}

	$effect(() => {
		if (currentVideoSrc && videoElement) {
			handleVideoSrcChange();
		}
	});

	onDestroy(() => {
		unsubscribeStep();
		if (videoElement) {
			videoElement.pause();
			videoElement = null;
		}
	});
</script>

{#if currentVideoSrc}
	<div class="video-container">
		<video
			bind:this={videoElement}
			src={currentVideoSrc}
			class="scene-video"
			autoplay={step !== 'riceCakeVisible' && step !== 'complete'}
			playsinline
			onended={handleVideoEnded}
			onloadeddata={handleVideoLoaded}
		/>
	</div>
{/if}

<style>
	.video-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		z-index: 1;
		background: #2d5016;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none; /* Allow interactions to pass through to rice cakes */
	}

	.scene-video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>

