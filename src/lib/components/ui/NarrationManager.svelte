<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentStep, nextStep } from '$lib/stores/stepStore';
	import { triggerSceneEvent } from '$lib/stores/sceneStore';
	import { languageStore } from '$lib/stores/languageStore';
	import { scene3Data } from '$lib/data/scene3';
	import { 
		createNarrationElement, 
		playNarration, 
		stopNarration,
		narrationLoading,
		narrationError
	} from '$lib/stores/audioStore';
	import { getAudioForText, revokeAudioURL } from '$lib/utils/ttsService';
	import type { Language } from '$lib/types/scene';

	let step = $state('initial' as any);
	let language: Language = $state('kr');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let currentAudioURL: string | null = $state(null);

	// Map steps to subtitle timings (matching SubtitleOverlay)
	const stepToSubtitleMap: Record<string, number> = {
		'tigerAppears': 1.0,
		'motherFalls': 4.0,
		'tigerSpeaks': 7.0,
		'riceCakeVisible': 11.0
	};

	function getSubtitleForStep(stepValue: string, lang: Language): string | null {
		const timing = stepToSubtitleMap[stepValue];
		if (!timing) return null;

		const subtitleEntry = scene3Data.audio.timings.find((t) => t.time === timing);
		if (!subtitleEntry) return null;

		return subtitleEntry.text[lang] || null;
	}

	function advanceToNextStep() {
		// Don't auto-advance from interaction steps or final step
		if (step === 'riceCakeVisible' || step === 'complete') {
			return;
		}

		// Determine what the next step will be
		const steps: any[] = ['initial', 'tigerAppears', 'motherFalls', 'tigerSpeaks', 'riceCakeVisible', 'tigerEats', 'complete'];
		const currentIndex = steps.indexOf(step);
		const nextStepValue = steps[currentIndex + 1];
		
		if (!nextStepValue) {
			return; // Already at the end
		}

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

	async function playNarrationForStep(stepValue: string, lang: Language) {
		// Skip narration for 'initial' step - video handles that
		if (stepValue === 'initial') {
			return;
		}

		const text = getSubtitleForStep(stepValue, lang);
		
		// If no narration text, auto-advance after a short delay
		if (!text || text.trim() === '') {
			// Auto-advance after 1 second for steps without narration
			setTimeout(() => {
				advanceToNextStep();
			}, 1000);
			return;
		}

		try {
			// Stop any existing narration
			stopNarration();

			// Revoke previous audio URL if exists
			if (currentAudioURL) {
				revokeAudioURL(currentAudioURL);
				currentAudioURL = null;
			}

			loading = true;
			error = null;

			// Get audio URL (will use cache if available)
			const audioURL = await getAudioForText(text, lang);
			currentAudioURL = audioURL;

			// Create and play audio element
			const audioElement = createNarrationElement(audioURL);
			
			// Listen for when audio ends to auto-advance
			audioElement.addEventListener('ended', () => {
				// Auto-advance to next step when narration completes
				advanceToNextStep();
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
		
		// Only play narration if step actually changed and has a subtitle
		if (previousStep !== s) {
			playNarrationForStep(s, language);
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

	// Start narration when component mounts (skip if initial step - video handles that)
	onMount(() => {
		if (step !== 'initial') {
			playNarrationForStep(step, language);
		}
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

