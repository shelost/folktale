<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import type { SceneStep } from '$lib/stores/stepStore';

	let step = $state<SceneStep>('initial');
	let videoElement: HTMLVideoElement | null = $state(null);
	let currentVideoSrc = $state<string | null>(null);
	let motherFallsClipIndex = $state(0);

	// Map steps to video files - all videos in consecutive order
	// Note: 'initial' step uses AnimationIntroVideo component with mountains.mp4
	// motherFalls uses tiger_2 then tiger_3 in sequence.
	const stepToVideoMap: Record<string, string> = {
		'tigerAppears': '/tiger_1.mp4',
		'motherFalls': '/tiger_2.mp4',
		'riceCakeVisible': '/tiger_4.mp4',
		'tigerEats': '/tiger_4.mp4', // Keep showing the last video
		'complete': '/tiger_4.mp4' // Keep showing the last video
	};

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
		if (s !== 'motherFalls') {
			motherFallsClipIndex = 0;
		}
		updateVideoSrc(s);

		// Pause video for interaction step, but play for final step
		if (videoElement && currentVideoSrc) {
			const video = videoElement;
			if (s === 'riceCakeVisible') {
				// Pause and show freeze frame - don't let it play during interaction
				video.pause();
				// Prevent autoplay by removing autoplay attribute temporarily
				video.removeAttribute('autoplay');
			} else if (s === 'tigerEats') {
				// Play the final video when rice cake is dropped
				video.setAttribute('autoplay', '');
				video.play().catch((error) => {
					console.error('Error playing final video:', error);
					// If autoplay fails, try muted autoplay as fallback
					if (error.name === 'NotAllowedError') {
						video.muted = true;
						video.play().catch((mutedError) => {
							console.error('Error playing muted final video:', mutedError);
						});
					}
				});
			} else if (s === 'complete') {
				// Keep video paused on complete step (story finished)
				video.pause();
				video.removeAttribute('autoplay');
			} else {
				// Resume playing for other steps
				video.setAttribute('autoplay', '');
				video.play().catch((error) => {
					console.error('Error playing video:', error);
				});
			}
		}
	});

	function updateVideoSrc(stepValue: SceneStep) {
		// For motherFalls, keep both clips contiguous by switching on `onended`.
		if (stepValue === 'motherFalls') {
			currentVideoSrc = motherFallsClipIndex === 0 ? '/tiger_2.mp4' : '/tiger_3.mp4';
		} else {
			const videoSrc = stepToVideoMap[stepValue];
			if (videoSrc) {
				currentVideoSrc = videoSrc;
			} else {
				currentVideoSrc = null;
			}
		}
	}

	function handleVideoEnded() {
		if (step === 'motherFalls' && motherFallsClipIndex === 0) {
			motherFallsClipIndex = 1;
			currentVideoSrc = '/tiger_3.mp4';
			return;
		}
	}

	function handleVideoLoaded() {
		// Auto-play video when it's loaded, but NOT for interaction step
		// For tigerEats step, we want to play the video
		if (videoElement && currentVideoSrc) {
			const video = videoElement;
			if (step === 'riceCakeVisible' || step === 'complete') {
				// Pause for interaction and complete steps
				video.pause();
			} else {
				// Play for other steps including tigerEats
				video.play().catch((error) => {
					console.error('Error auto-playing video:', error);
					// If autoplay fails (e.g., browser policy), try muted autoplay as fallback
					if (error.name === 'NotAllowedError') {
						video.muted = true;
						video.play().catch((mutedError) => {
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
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={videoElement}
			src={currentVideoSrc}
			class="scene-video"
			autoplay={step !== 'riceCakeVisible' && step !== 'complete'}
			playsinline
			onended={handleVideoEnded}
			onloadeddata={handleVideoLoaded}
		></video>
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
		background: black;
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

