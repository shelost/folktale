<script lang="ts">
	import { currentStep, goToStep, getAllSteps, getStepIndex, type SceneStep } from '$lib/stores/stepStore';
	import { triggerSceneEvent } from '$lib/stores/sceneStore';
	import { languageStore } from '$lib/stores/languageStore';
	import type { Language } from '$lib/types/scene';

	let step = $state<SceneStep>('initial');
	let language: Language = $state('kr');

	const unsubscribeStep = currentStep.subscribe((s) => {
		step = s;
	});

	const unsubscribeLang = languageStore.subscribe((lang) => {
		language = lang;
	});

	const steps = getAllSteps();

	function getStepLabel(stepValue: SceneStep): string {
		const labels: Record<SceneStep, { kr: string; en: string }> = {
			initial: { kr: '시작', en: 'Start' },
			tigerAppears: { kr: '호랑이 등장', en: 'Tiger Appears' },
			motherFalls: { kr: '어머니 넘어짐', en: 'Mother Falls' },
			tigerSpeaks: { kr: '호랑이 말함', en: 'Tiger Speaks' },
			riceCakeVisible: { kr: '떡 주기', en: 'Feed Rice Cake' },
			tigerEats: { kr: '호랑이 먹음', en: 'Tiger Eats' },
			complete: { kr: '완료', en: 'Complete' }
		};
		return language === 'kr' ? labels[stepValue].kr : labels[stepValue].en;
	}

	function handleStepClick(targetStep: SceneStep) {
		const currentIndex = getStepIndex(step);
		const targetIndex = getStepIndex(targetStep);
		
		// Only allow going to steps that are at or before the current step + 1
		if (targetIndex <= currentIndex + 1 && isStepAvailable(targetStep)) {
			goToStep(targetStep);
			
			// Trigger the corresponding scene event for the target step
			switch (targetStep) {
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
	}

	function isStepActive(stepValue: SceneStep): boolean {
		return step === stepValue;
	}

	function isStepCompleted(stepValue: SceneStep): boolean {
		const currentIndex = getStepIndex(step);
		const stepIndex = getStepIndex(stepValue);
		return stepIndex < currentIndex;
	}

	function isStepAvailable(stepValue: SceneStep): boolean {
		const currentIndex = getStepIndex(step);
		const stepIndex = getStepIndex(stepValue);
		// Allow current step, completed steps, and next step
		return stepIndex <= currentIndex + 1;
	}
</script>

<div class="step-slider">
	<div class="step-slider-container">
		{#each steps as stepItem, index}
			<button
				class="step-button"
				class:active={isStepActive(stepItem)}
				class:completed={isStepCompleted(stepItem)}
				class:disabled={!isStepAvailable(stepItem)}
				onpointerdown={() => handleStepClick(stepItem)}
				aria-label={getStepLabel(stepItem)}
				disabled={!isStepAvailable(stepItem)}
			>
				<span class="step-number">{index + 1}</span>
				<span class="step-label">{getStepLabel(stepItem)}</span>
			</button>
			{#if index < steps.length - 1}
				<div class="step-connector" class:completed={isStepCompleted(stepItem)}></div>
			{/if}
		{/each}
	</div>
</div>

<style>
	.step-slider {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(10px);
		border-bottom: 2px solid rgba(0, 0, 0, 0.1);
		padding: 12px 20px;
		z-index: 300;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.step-slider-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		max-width: 1200px;
		margin: 0 auto;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.step-slider-container::-webkit-scrollbar {
		display: none;
	}

	.step-button {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 8px 16px;
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		background: white;
		cursor: pointer;
		transition: all 0.2s ease;
		min-width: 100px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.step-button:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
		border-color: #4a90e2;
	}

	.step-button.active {
		background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
		color: white;
		border-color: #357abd;
		box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4);
	}

	.step-button.completed {
		background: #f0f8ff;
		border-color: #4a90e2;
		color: #357abd;
	}

	.step-button.completed:hover:not(:disabled) {
		background: #e6f3ff;
	}

	.step-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: #f5f5f5;
	}

	.step-number {
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1;
	}

	.step-button.active .step-number {
		color: white;
	}

	.step-label {
		font-size: 0.75rem;
		font-weight: 500;
		text-align: center;
		white-space: nowrap;
		line-height: 1.2;
	}

	.step-button.active .step-label {
		color: white;
	}

	.step-connector {
		width: 30px;
		height: 2px;
		background: #e0e0e0;
		flex-shrink: 0;
		transition: background 0.2s ease;
	}

	.step-connector.completed {
		background: #4a90e2;
	}

	@media (max-width: 768px) {
		.step-slider {
			padding: 8px 12px;
		}

		.step-button {
			min-width: 80px;
			padding: 6px 12px;
		}

		.step-label {
			font-size: 0.65rem;
		}

		.step-number {
			font-size: 1rem;
		}

		.step-connector {
			width: 20px;
		}
	}
</style>

