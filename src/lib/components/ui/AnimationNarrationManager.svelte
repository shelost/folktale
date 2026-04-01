<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { currentStep, nextStep } from '$lib/stores/stepStore';
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
	import { setSubtitleIndex, resetSubtitleIndex } from '$lib/stores/subtitleStore';
	import type { Language } from '$lib/types/scene';
	import { get } from 'svelte/store';

	let step = $state('initial' as any);
	let language: Language = $state('kr');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let currentAudioURL: string | null = $state(null);
	const prefetchCache = new Map<string, string>();

	// Map steps to subtitle timings (matching AnimationSubtitleOverlay)
	// motherFalls will show both captions (1.0 and 4.0) sequentially
	const stepToSubtitleMap: Record<string, number[]> = {
		'tigerAppears': [1.0],
		'motherFalls': [4.0, 7.0],
		'riceCakeVisible': [14.0],
		'tigerEats': [19.0] 
	};

	function getSubtitleForStep(stepValue: string, lang: Language, index: number = 0): string | null {
		const timings = stepToSubtitleMap[stepValue];
		if (!timings || !Array.isArray(timings)) return null;
		if (index >= timings.length) return null;

		const timing = timings[index];
		const subtitleEntry = animationData.audio.timings.find((t) => t.time === timing);
		if (!subtitleEntry) return null;

		return subtitleEntry.text[lang] || null;
	}

	function getSubtitleCountForStep(stepValue: string): number {
		const timings = stepToSubtitleMap[stepValue];
		if (!timings || !Array.isArray(timings)) return 0;
		return timings.length;
	}

	function getNarrationTextsForStep(stepValue: string, lang: Language): string[] {
		const timings = stepToSubtitleMap[stepValue] ?? [];
		return timings
			.map((_, i) => getSubtitleForStep(stepValue, lang, i))
			.filter((text): text is string => Boolean(text && text.trim()));
	}

	function getNextStepForPrefetch(stepValue: string): string | null {
		const allSteps = ['initial', 'tigerAppears', 'motherFalls', 'riceCakeVisible', 'tigerEats', 'complete'];
		const index = allSteps.indexOf(stepValue);
		if (index === -1 || index >= allSteps.length - 1) return null;
		return allSteps[index + 1];
	}

	async function prefetchNarration(stepValue: string, lang: Language): Promise<void> {
		if (stepValue === 'initial' || stepValue === 'complete') return;
		const texts = getNarrationTextsForStep(stepValue, lang);
		if (texts.length === 0) return;
		await Promise.all(
			texts.map(async (text) => {
				const cacheKey = `${lang}:${text}`;
				if (prefetchCache.has(cacheKey)) return;
				try {
					const audioURL = await getAudioForText(text, lang);
					prefetchCache.set(cacheKey, audioURL);
				} catch (prefetchError) {
					console.warn('Narration prefetch failed:', prefetchError);
				}
			})
		);
	}

	function advanceToNextStep() {
		// Get current step from store to avoid stale closure values
		const currentStepValue = get(currentStep);
		if (currentStepValue === 'riceCakeVisible' || currentStepValue === 'tigerEats' || currentStepValue === 'complete') {
			return;
		}

		// All steps in order
		const allSteps: any[] = ['initial', 'tigerAppears', 'motherFalls', 'riceCakeVisible', 'tigerEats', 'complete'];
		const currentIndex = allSteps.indexOf(currentStepValue);
		
		if (currentIndex === -1 || currentIndex >= allSteps.length - 1) {
			return; 
		}

		const nextStepValue = allSteps[currentIndex + 1];
	
		nextStep();
		
		switch (nextStepValue) {
			case 'tigerAppears':
				triggerSceneEvent('tigerAppears');
				break;
			case 'motherFalls':
				triggerSceneEvent('motherFalls');
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
		if (stepValue === 'initial') {
			return;
		}

		// For motherFalls, play both captions sequentially (1.0 then 4.0)
		if (stepValue === 'motherFalls') {
			await playMultipleNarrations(stepValue, lang, isManualChange);
			return;
		}

		const text = getSubtitleForStep(stepValue, lang);
		
		// If no narration text, auto-advance immediately
		// BUT: if this is a manual change from initial to tigerAppears, don't auto-advance
		if (!text || text.trim() === '') {
			// If user manually started from initial, don't auto-advance from first step
			if (isManualChange && stepValue === 'tigerAppears') {
				return; 
			}
			advanceToNextStep();
			return;
		}

		try {
			loading = true;
			error = null;

			// Get audio URL (will use cache if available)
			const cacheKey = `${lang}:${text}`;
			const audioURL = prefetchCache.get(cacheKey) ?? (await getAudioForText(text, lang));
			currentAudioURL = audioURL;

			// Create and play audio element
			const audioElement = createNarrationElement(audioURL);
			
			// Listen for when audio ends to auto-advance
			audioElement.addEventListener('ended', () => {
				// Don't auto-advance from tigerEats (final step) - story ends here
				if (stepValue === 'tigerEats') {
					return; // Story complete, stop here
				}
				advanceToNextStep();
			});

			playNarration(audioElement);
		} catch (err) {
			console.error('Failed to play narration:', err);
			error = err instanceof Error ? err.message : 'Failed to generate narration';
			loading = false;
			// Graceful degradation - auto-advance even if narration fails
			// BUT: if this is a manual change from initial, don't auto-advance
			if (isManualChange && stepValue === 'tigerAppears') {
				// User manually started, stay on first step even if narration fails
				return;
			}
			advanceToNextStep();
		}
	}

	async function playMultipleNarrations(stepValue: string, lang: Language, isManualChange: boolean = false) {
		const subtitleCount = getSubtitleCountForStep(stepValue);
		if (subtitleCount === 0) {
			// No narrations, auto-advance
			advanceToNextStep();
			return;
		}

		// Reset subtitle index at the start
		resetSubtitleIndex();

		// Play each narration sequentially
		for (let i = 0; i < subtitleCount; i++) {
			// Update subtitle index to show the correct caption
			setSubtitleIndex(i);
			
			const text = getSubtitleForStep(stepValue, lang, i);
			if (!text || text.trim() === '') {
				continue; // Skip empty narrations
			}

			try {
				loading = true;
				error = null;

				// Get audio URL (will use cache if available)
				const cacheKey = `${lang}:${text}`;
				const audioURL = prefetchCache.get(cacheKey) ?? (await getAudioForText(text, lang));
				currentAudioURL = audioURL;

				// Create and play audio element
				const audioElement = createNarrationElement(audioURL);
				
				// Wait for this narration to complete before playing the next one
				await new Promise<void>((resolve, reject) => {
					audioElement.addEventListener('ended', () => {
						resolve();
					});
					audioElement.addEventListener('error', (e) => {
						console.error('Narration audio error:', e);
						resolve(); // Continue even on error
					});
					playNarration(audioElement);
				});

			} catch (err) {
				console.error(`Failed to play narration ${i + 1}:`, err);
				error = err instanceof Error ? err.message : 'Failed to generate narration';
				loading = false;
			}
		}

		loading = false;

		// After all narrations complete, auto-advance immediately (unless it's the final step)
		if (stepValue !== 'tigerEats') {
			advanceToNextStep();
		}
	}

	const unsubscribeStep = currentStep.subscribe((s) => {
		const previousStep = step;
		step = s;
		
		// Reset subtitle index when step changes
		if (previousStep !== s) {
			resetSubtitleIndex();
		}
		
		// Always play narration when step changes (will stop previous narration)
		// Mark as manual change only if coming from initial (user clicked play button)
		if (previousStep !== s) {
			const isManualStart = previousStep === 'initial' && s === 'tigerAppears';
			const nextStepValue = getNextStepForPrefetch(s);
			if (nextStepValue) {
				prefetchNarration(nextStepValue, language);
			}
			setTimeout(() => {
				playNarrationForStep(s, language, isManualStart);
			}, 0);
		}
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		const previousLang = language;
		language = lang;
		
		// If language changed, replay narration for current step
		if (previousLang !== lang && step) {
			const nextStepValue = getNextStepForPrefetch(step);
			if (nextStepValue) {
				prefetchNarration(nextStepValue, lang);
			}
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

