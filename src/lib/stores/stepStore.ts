import { writable } from 'svelte/store';

export type SceneStep = 
	| 'initial'
	| 'tigerAppears'
	| 'motherFalls'
	| 'tigerSpeaks'
	| 'riceCakeVisible'
	| 'tigerEats'
	| 'complete';

export const currentStep = writable<SceneStep>('initial');

export function nextStep() {
	currentStep.update((step) => {
		const steps: SceneStep[] = [
			'initial',
			'tigerAppears',
			'motherFalls',
			'tigerSpeaks',
			'riceCakeVisible',
			'tigerEats',
			'complete'
		];
		const currentIndex = steps.indexOf(step);
		if (currentIndex < steps.length - 1) {
			return steps[currentIndex + 1];
		}
		return step;
	});
}

export function canGoNext(): boolean {
	let canGo = false;
	currentStep.subscribe((step) => {
		canGo = step !== 'complete';
	})();
	return canGo;
}

export function goToStep(targetStep: SceneStep) {
	currentStep.set(targetStep);
}

export function getStepIndex(step: SceneStep): number {
	const steps: SceneStep[] = [
		'initial',
		'tigerAppears',
		'motherFalls',
		'tigerSpeaks',
		'riceCakeVisible',
		'tigerEats',
		'complete'
	];
	return steps.indexOf(step);
}

export function getAllSteps(): SceneStep[] {
	return [
		'initial',
		'tigerAppears',
		'motherFalls',
		'tigerSpeaks',
		'riceCakeVisible',
		'tigerEats',
		'complete'
	];
}

