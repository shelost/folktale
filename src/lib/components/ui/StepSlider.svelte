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

$primary: #7a2f20;
$primary-dark: #5f2317;
$completed-bg: #efe1bf;
$completed-hover-bg: #e8d6b0;
$completed-color: #5f2317;
$button-bg: white;
$button-border: #8d6a3f;
$button-radius: 12px;
$disabled-bg: #d8c7a1;
$shadow-light: 0 2px 8px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 4px 8px rgba(0, 0, 0, 0.15);
$shadow-active: 0 4px 12px rgba($primary, 0.4);
$connector-bg: #8d6a3f;
$connector-active-bg: $primary;

.step-slider {
	position: fixed;
	top: 12px;
	left: 50%;
	transform: translateX(-50%);
	background: linear-gradient(180deg, rgba(242, 229, 200, 0.95) 0%, rgba(230, 212, 174, 0.95) 100%);
	backdrop-filter: blur(6px);
	border-radius: 60px;
	border: 2px solid #8d6a3f;
	padding: 12px 20px;
	z-index: 1100;
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

	border: 2px solid #8d6a3f;
	border-radius: 60px;
	background: rgba(255, 246, 227, 0.85);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;

	&:hover:not(:disabled) {
		box-shadow: $shadow-hover;
		border-color: $primary;
	}

	&.active {
		background: $primary;
		color: #f9ecd4;
		box-shadow: $shadow-active;

		.step-number,
		.step-label {
			color: white;
		}
	}

	&.completed {
		background: rgba(239, 225, 191, 0.95);
		color: #3f2a18;

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
	color: #3f2a18;
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
