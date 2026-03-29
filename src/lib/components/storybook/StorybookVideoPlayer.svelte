<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import { currentSubtitleIndex } from '$lib/stores/subtitleStore';
	import type { SceneStep } from '$lib/stores/stepStore';

	let step = $state<SceneStep>('initial');
	let videoElement: HTMLVideoElement | null = $state(null);
	let showVideo = $state(false);
	let subtitleIndex = $state(0);
	let timeUpdateHandler: (() => void) | null = null;

	const VIDEO_SRC = '/tiger_storybook.mp4';

	// Cutoff points define the end time for each section
	const stepSegments: Record<string, { start: number; end: number | null }> = {
		'tigerAppears': { start: 0, end: 4 },
		'motherFalls': { start: 4, end: 8 },
		'riceCakeVisible': { start: 8, end: 12 },
		'tigerEats': { start: 12, end: null },
		'complete': { start: 12, end: null }
	};

	function attachTimeGuard() {
		if (!videoElement) return;

		if (timeUpdateHandler) {
			videoElement.removeEventListener('timeupdate', timeUpdateHandler);
		}

		const segment = stepSegments[step];
		if (!segment || segment.end === null) {
			timeUpdateHandler = null;
			return;
		}

		timeUpdateHandler = () => {
			if (videoElement && videoElement.currentTime >= segment.end!) {
				videoElement.pause();
				videoElement.currentTime = segment.end!;
			}
		};

		videoElement.addEventListener('timeupdate', timeUpdateHandler);
	}

	function seekAndPlay(segment: { start: number; end: number | null }) {
		if (!videoElement) return;

		videoElement.currentTime = segment.start;

		if (step === 'riceCakeVisible' || step === 'complete') {
			videoElement.pause();
		} else {
			videoElement.play().catch((error) => {
				console.error('Error playing video:', error);
				if (error.name === 'NotAllowedError') {
					videoElement!.muted = true;
					videoElement!.play().catch((mutedError) => {
						console.error('Error playing muted video:', mutedError);
					});
				}
			});
		}

		attachTimeGuard();
	}

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;

		const segment = stepSegments[s];
		if (segment) {
			showVideo = true;
		} else {
			showVideo = false;
			return;
		}

		if (videoElement) {
			if (s === 'riceCakeVisible') {
				videoElement.pause();
				videoElement.removeAttribute('autoplay');
			} else if (s === 'tigerEats') {
				seekAndPlay(segment);
			} else if (s === 'complete') {
				videoElement.pause();
				videoElement.removeAttribute('autoplay');
			} else {
				seekAndPlay(segment);
			}
		}
	});

	const unsubscribeSubtitleIndex = currentSubtitleIndex.subscribe((index) => {
		subtitleIndex = index;
		// For the storybook player, the video plays continuously within a segment,
		// so subtitle index changes don't require seeking — narration handles it.
	});

	function handleVideoEnded() {
		// Video ended — narration manager handles advancement
	}

	function handleVideoLoaded() {
		if (!videoElement) return;

		const segment = stepSegments[step];
		if (!segment) return;

		if (step === 'riceCakeVisible' || step === 'complete') {
			videoElement.currentTime = segment.start;
			videoElement.pause();
		} else if (step !== 'initial') {
			seekAndPlay(segment);
		}
	}

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeSubtitleIndex();
		if (videoElement) {
			if (timeUpdateHandler) {
				videoElement.removeEventListener('timeupdate', timeUpdateHandler);
			}
			videoElement.pause();
			videoElement = null;
		}
	});
</script>

{#if showVideo}
	<div class="video-container">
		<!-- svelte-ignore a11y_media_has_caption -->
		<video
			bind:this={videoElement}
			src={VIDEO_SRC}
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
		pointer-events: none;
	}

	.scene-video {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}
</style>
