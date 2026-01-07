export type Language = 'kr' | 'en';

export interface BilingualText {
	kr: string;
	en: string;
}

export interface AudioTiming {
	time: number;
	text: BilingualText;
}

export interface Position {
	x: number;
	y: number;
}

export interface Size {
	width: number;
	height: number;
}

export interface TigerState extends Position {
	width: number;
	height: number;
	visible: boolean;
	mouthOpen: boolean;
	animationState: 'idle' | 'appearing' | 'speaking' | 'eating';
	animationStartTime?: number;
	finalX?: number; // Target X position after animation
	color: string;
}

export interface MotherState extends Position {
	width: number;
	height: number;
	visible: boolean;
	animationState: 'walking' | 'falling' | 'fallen';
	color: string;
}

export interface RiceCakeState extends Position {
	id: string;
	width: number;
	height: number;
	visible: boolean;
	draggable: boolean;
	color: string;
	fed: boolean;
}

export interface DropZone {
	id: string;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface Interaction {
	id: string;
	type: 'drag-drop' | 'click' | 'swipe';
	trigger: string;
	dropZone?: DropZone;
	successCallback?: string;
}

export interface CulturalDictionaryEntry {
	term: string;
	definition: BilingualText;
}

export interface ParentTip {
	text: BilingualText;
	trigger: string;
}

export interface SceneData {
	id: string;
	background: {
		type: 'forest' | 'house' | 'mountain';
		color: string;
	};
	audio: {
		url?: string;
		timings: AudioTiming[];
	};
	characters: {
		tiger: TigerState;
		mother: MotherState;
		riceCake: RiceCakeState;
		riceCakes?: RiceCakeState[];
	};
	interactions: Interaction[];
	culturalDictionary: CulturalDictionaryEntry[];
	parentTips: ParentTip[];
}

export interface SceneState {
	currentScene: string;
	language: Language;
	audioPlaying: boolean;
	audioCurrentTime: number;
	characters: {
		tiger: TigerState;
		mother: MotherState;
		riceCakes: RiceCakeState[];
	};
	interactionState: {
		dragging: boolean;
		dragItem: string | null;
		dragPosition: Position | null;
		completedInteractions: string[];
		riceCakesFed: number;
	};
}

