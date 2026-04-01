<script lang="ts">
	import { onDestroy } from 'svelte';
	import { currentStep } from '$lib/stores/stepStore';
	import { currentSubtitleIndex } from '$lib/stores/subtitleStore';
	import type { SceneStep } from '$lib/stores/stepStore';

	let step = $state<SceneStep>('initial');
	let prevStep = $state<SceneStep>('initial');
	let videoElement: HTMLVideoElement | null = $state(null);
	let showVideo = $state(false);
	let subtitleIndex = $state(0);
	let timeUpdateHandler: (() => void) | null = null;

	const VIDEO_SRC = '/tiger_storybook.mp4';

	const stepSegments: Record<string, { start: number; end: number | null }> = {
		'tigerAppears': { start: 0, end: 4 },
		'motherFalls': { start: 4, end: 8 },
		'riceCakeVisible': { start: 8, end: 12 },
		'tigerEats': { start: 12, end: null },
		'complete': { start: 12, end: null }
	};

	const INTERACTION_BOUNDARY = 8;

	const stepOrder = ['initial', 'tigerAppears', 'motherFalls', 'riceCakeVisible', 'tigerEats', 'complete'];

	function isSequentialAdvance(from: SceneStep, to: SceneStep): boolean {
		return stepOrder.indexOf(to) === stepOrder.indexOf(from) + 1;
	}

	function detachTimeGuard() {
		if (videoElement && timeUpdateHandler) {
			videoElement.removeEventListener('timeupdate', timeUpdateHandler);
		}
		timeUpdateHandler = null;
	}

	function attachPauseGuard(pauseAt: number) {
		detachTimeGuard();
		if (!videoElement) return;

		timeUpdateHandler = () => {
			if (videoElement && videoElement.currentTime >= pauseAt) {
				videoElement.pause();
				videoElement.currentTime = pauseAt;
			}
		};
		videoElement.addEventListener('timeupdate', timeUpdateHandler);
	}

	function ensurePlaying() {
		if (!videoElement || !videoElement.paused) return;
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

	const unsubscribeStep = currentStep.subscribe((s) => {
		prevStep = step;
		step = s;

		const segment = stepSegments[s];
		if (!segment) {
			showVideo = false;
			return;
		}

		showVideo = true;
		detachTimeGuard();

		if (!videoElement) return;

		if (s === 'tigerAppears' || s === 'motherFalls') {
			if (isSequentialAdvance(prevStep, s) && !videoElement.paused) {
				// Sequential: keep playing, don't seek
			} else {
				videoElement.currentTime = segment.start;
			}
			attachPauseGuard(INTERACTION_BOUNDARY);
			ensurePlaying();
			return;
		}

		if (s === 'riceCakeVisible') {
			videoElement.currentTime = segment.start;
			videoElement.pause();
			return;
		}

		if (s === 'tigerEats') {
			videoElement.currentTime = segment.start;
			ensurePlaying();
			return;
		}

		if (s === 'complete') {
			videoElement.pause();
			return;
		}
	});

	const unsubscribeSubtitleIndex = currentSubtitleIndex.subscribe((index) => {
		subtitleIndex = index;
	});

	function handleVideoEnded() {
		// Video ended — narration manager handles step advancement.
	}

	function handleVideoLoaded() {
		if (!videoElement) return;

		const segment = stepSegments[step];
		if (!segment) return;

		if (step === 'riceCakeVisible' || step === 'complete') {
			videoElement.currentTime = segment.start;
			videoElement.pause();
		} else if (step !== 'initial') {
			videoElement.currentTime = segment.start;
			if (step === 'tigerAppears' || step === 'motherFalls') {
				attachPauseGuard(INTERACTION_BOUNDARY);
			}
			ensurePlaying();
		}
	}

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeSubtitleIndex();
		detachTimeGuard();
		if (videoElement) {
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
