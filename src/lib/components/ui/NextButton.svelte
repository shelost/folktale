<script lang="ts">
	import { currentStep, nextStep, canGoNext } from '$lib/stores/stepStore';
	import { triggerSceneEvent } from '$lib/stores/sceneStore';
	import { languageStore } from '$lib/stores/languageStore';
	import type { Language } from '$lib/types/scene';

	let step = $state('initial' as any);
	let language: Language = $state('kr');
	let showButton = $state(true);

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
		showButton = s !== 'complete' && s !== 'riceCakeVisible'; // Hide during interaction phase
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	function handleNext() {
		// Determine what the next step will be
		const steps: any[] = ['initial', 'tigerAppears', 'motherFalls', 'tigerSpeaks', 'riceCakeVisible', 'tigerEats', 'complete'];
		const currentIndex = steps.indexOf(step);
		const nextStepValue = steps[currentIndex + 1];
		
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
				showButton = false; // Hide button during interaction
				break;
		}
	}

	function getButtonText(): string {
		if (step === 'initial') {
			return language === 'kr' ? '시작하기' : 'Start';
		}
		if (step === 'tigerEats') {
			return language === 'kr' ? '완료' : 'Complete';
		}
		return language === 'kr' ? '다음' : 'Next';
	}
</script>

{#if showButton}
	<button class="next-button" onpointerdown={handleNext} aria-label={getButtonText()}>
		<span class="next-button-text">{getButtonText()}</span>
		<span class="next-button-icon">→</span>
	</button>
{/if}

<style>
	.next-button {
		position: fixed;
		bottom: 40px;
		left: 50%;
		transform: translateX(-50%);
		background: #ffce00;
		color: black;
		border: none;
		border-radius: 60px;
		padding: 16px 32px;
		width: 300px;
		cursor: pointer;
		font-size: 24px;
		font-weight: 900;
		display: flex;
		align-items: center;
		gap: 12px;
		z-index: 200;
		border: 3px solid black;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		transition: transform 0.2s, box-shadow 0.2s;

		display: flex;
		justify-content: center;	
	}

	.next-button:hover {
		box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
	}

	.next-button-text {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.next-button-icon {
		font-size: 1.3rem;
		transition: transform 0.2s;
	}

	.next-button:hover .next-button-icon {
		transform: translateX(4px);
	}
</style>

