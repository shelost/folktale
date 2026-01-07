<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentStep, nextStep, goToStep } from '$lib/stores/stepStore';
	import { triggerSceneEvent } from '$lib/stores/sceneStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { animationData } from '$lib/data/animation';
	import { 
		createNarrationElement, 
		playNarration, 
		stopNarration,
		narrationLoading,
		narrationError
	} from '$lib/stores/audioStore';
	import { getAudioForText, revokeAudioURL } from '$lib/utils/ttsService';
	import type { Language } from '$lib/types/scene';
	import { get } from 'svelte/store';

	let step = $state('initial' as any);
	let language: Language = $state('kr');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let currentAudioURL: string | null = $state(null);

	// Map steps to subtitle timings (matching AnimationSubtitleOverlay)
	const stepToSubtitleMap: Record<string, number> = {
		'tigerAppears': 1.0,
		'motherFalls': 4.0, // Combined caption for motherFalls and tigerSpeaks - only show once
		'riceCakeVisible': 11.0,
		'tigerEats': 15.0 // Final caption after rice cake is fed
	};

	function getSubtitleForStep(stepValue: string, lang: Language): string | null {
		const timing = stepToSubtitleMap[stepValue];
		if (!timing) return null;

		const subtitleEntry = animationData.audio.timings.find((t) => t.time === timing);
		if (!subtitleEntry) return null;

		return subtitleEntry.text[lang] || null;
	}

	function advanceToNextStep() {
		// Get current step from store to avoid stale closure values
		const currentStepValue = get(currentStep);
		
		// Don't auto-advance from interaction steps or final step
		// tigerEats will show final caption and then stop (no auto-advance to complete)
		if (currentStepValue === 'riceCakeVisible' || currentStepValue === 'tigerEats' || currentStepValue === 'complete') {
			return;
		}

		// All steps in order (including intermediate steps)
		const allSteps: any[] = ['initial', 'tigerAppears', 'motherFalls', 'tigerSpeaks', 'riceCakeVisible', 'tigerEats', 'complete'];
		const currentIndex = allSteps.indexOf(currentStepValue);
		
		if (currentIndex === -1 || currentIndex >= allSteps.length - 1) {
			return; // Invalid step or already at the end
		}

		const nextStepValue = allSteps[currentIndex + 1];
		
		// Move to next step
		nextStep();
		
		// Trigger the corresponding scene event
		switch (nextStepValue) {
			case 'tigerAppears':
				triggerSceneEvent('tigerAppears');
				break;
			case 'motherFalls':
				triggerSceneEvent('motherFalls');
				break;
			case 'tigerSpeaks':
				triggerSceneEvent('tigerSpeaks');
				break;
			case 'riceCakeVisible':
				triggerSceneEvent('riceCakeVisible');
				break;
		}
	}

	async function playNarrationForStep(stepValue: string, lang: Language, isManualChange: boolean = false) {
		// Always stop any existing narration first (especially important for manual step changes)
		stopNarration();
		
		// Revoke previous audio URL if exists
		if (currentAudioURL) {
			revokeAudioURL(currentAudioURL);
			currentAudioURL = null;
		}

		// For 'initial' step, do nothing - let AnimationIntroVideo handle it
		// The intro video will auto-advance when the video ends
		if (stepValue === 'initial') {
			return;
		}

		// Skip narration for tigerSpeaks since it shares the same caption as motherFalls
		// The combined caption will play during motherFalls step
		if (stepValue === 'tigerSpeaks') {
			// Auto-advance quickly since caption already shown in motherFalls
			setTimeout(() => {
				advanceToNextStep();
			}, 500);
			return;
		}

		const text = getSubtitleForStep(stepValue, lang);
		
		// If no narration text, auto-advance after a short delay
		if (!text || text.trim() === '') {
			// Auto-advance after pause delay for steps without narration
			setTimeout(() => {
				advanceToNextStep();
			}, 2500); // 2.5 second pause (1s base + 1.5s pause)
			return;
		}

		try {
			loading = true;
			error = null;

			// Get audio URL (will use cache if available)
			const audioURL = await getAudioForText(text, lang);
			currentAudioURL = audioURL;

			// Create and play audio element
			const audioElement = createNarrationElement(audioURL);
			
			// Listen for when audio ends to auto-advance
			audioElement.addEventListener('ended', () => {
				// Don't auto-advance from tigerEats (final step) - story ends here
				if (stepValue === 'tigerEats') {
					return; // Story complete, stop here
				}
				// Add a pause delay before advancing to next step
				setTimeout(() => {
					advanceToNextStep();
				}, 1500); // 1.5 second pause between slides
			});

			playNarration(audioElement);
		} catch (err) {
			console.error('Failed to play narration:', err);
			error = err instanceof Error ? err.message : 'Failed to generate narration';
			loading = false;
			// Graceful degradation - auto-advance even if narration fails
			setTimeout(() => {
				advanceToNextStep();
			}, 1000);
		}
	}

	const unsubscribeStep = currentStep.subscribe((s) => {
		const previousStep = step;
		step = s;
		
		// Always play narration when step changes (will stop previous narration)
		if (previousStep !== s) {
			playNarrationForStep(s, language, true);
		}
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		const previousLang = language;
		language = lang;
		
		// If language changed, replay narration for current step
		if (previousLang !== lang && step) {
			playNarrationForStep(step, lang);
		}
	});

	const unsubscribeLoading = narrationLoading.subscribe((isLoading) => {
		loading = isLoading;
	});

	const unsubscribeError = narrationError.subscribe((err) => {
		error = err;
	});

	// Start narration when component mounts
	onMount(() => {
		playNarrationForStep(step, language);
	});

	onDestroy(() => {
		unsubscribeStep();
		unsubscribeLang();
		unsubscribeLoading();
		unsubscribeError();
		stopNarration();
		if (currentAudioURL) {
			revokeAudioURL(currentAudioURL);
		}
	});
</script>

<!-- This component doesn't render anything visible, it just manages narration -->
<!-- Loading and error states can be shown via the audio store if needed -->

