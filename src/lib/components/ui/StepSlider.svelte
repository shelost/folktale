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
			riceCakeVisible: { kr: '떡 주기', en: 'Feed Rice Cake' },
			tigerEats: { kr: '호랑이 먹음', en: 'Tiger Eats' },
			complete: { kr: '완료', en: 'Complete' }
		};
		return language === 'kr' ? labels[stepValue].kr : labels[stepValue].en;
	}

	function handleStepClick(targetStep: SceneStep) {
		// Allow clicking any step at any time - navigation is always allowed
		goToStep(targetStep);
		
		// Trigger the corresponding scene event for the target step
		switch (targetStep) {
			case 'tigerAppears':
				triggerSceneEvent('tigerAppears');
				break;
			case 'motherFalls':
				triggerSceneEvent('motherFalls');
				// Also trigger tigerSpeaks event since it's part of the combined step
				triggerSceneEvent('tigerSpeaks');
				break;
			case 'riceCakeVisible':
				triggerSceneEvent('riceCakeVisible');
				break;
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
		// All steps are always available/clickable
		return true;
	}
</script>

<div class="step-slider">
	<div class="step-slider-container">
		{#each steps as stepItem, index}
			<button
				class="step-button"
				class:active={isStepActive(stepItem)}
				class:completed={isStepCompleted(stepItem)}
				onpointerdown={() => handleStepClick(stepItem)}
				aria-label={getStepLabel(stepItem)}
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

<style lang="scss">

$primary: #4a90e2;
$primary-dark: #357abd;
$completed-bg: #f0f8ff;
$completed-hover-bg: #e6f3ff;
$completed-color: #357abd;
$button-bg: white;
$button-border: #e0e0e0;
$button-radius: 12px;
$disabled-bg: #f5f5f5;
$shadow-light: 0 2px 8px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 4px 8px rgba(0, 0, 0, 0.15);
$shadow-active: 0 4px 12px rgba($primary, 0.4);
$connector-bg: #e0e0e0;
$connector-active-bg: $primary;

.step-slider {
	position: fixed;
	top: 12px;
	left: 50%;
	transform: translateX(-50%);
	background: rgba(0, 0, 0, 0.7);
	backdrop-filter: blur(10px);
	border-radius: 60px;
	border: 1px solid rgba(255, 255, 255, 0.2);
	padding: 12px 20px;
	z-index: 10;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);

	@media (max-width: 768px) {
		padding: 8px 12px;
	}
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

	&::-webkit-scrollbar {
		display: none;
	}
}

.step-button {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;

	gap: 4px;
	padding: 4px;
	width: 32px;
	height: 32px;

	border: 2px solid white;
	border-radius: 60px;
	background: rgba(black, .1);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

	&:hover:not(:disabled) {
		box-shadow: $shadow-hover;
		border-color: $primary;
	}

	&.active {
		background: #030025;
		color: white;
		box-shadow: $shadow-active;

		.step-number,
		.step-label {
			color: white;
		}
	}

	&.completed {
		background: rgba(black, .2);
		color: black;

		&:hover:not(:disabled) {
			background: $completed-hover-bg;
		}
	}

	&:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		background: $disabled-bg;
	}

	@media (max-width: 768px) {
		min-width: 80px;
		padding: 6px 12px;
	}
}

.step-number {
	color: white;
	font-size: 14px;
	font-weight: 500;
	line-height: 1;

	@media (max-width: 768px) {
		font-size: 1rem;
	}
}

.step-label {
	font-size: 10px;
	font-weight: 400;
	text-align: center;
	white-space: nowrap;
	line-height: 1.2;
	display: none;

	@media (max-width: 768px) {
		font-size: 0.65rem;
	}
}

.step-connector {
	width: 30px;
	height: 2px;
	background: $connector-bg;
	flex-shrink: 0;
	transition: background 0.2s ease;

	&.completed {
		background: $connector-active-bg;
	}

	@media (max-width: 768px) {
		width: 20px;
	}
}
</style>
