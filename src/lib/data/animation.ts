import type { SceneData, BilingualText } from '$lib/types/scene';

export const animationData: SceneData = {
	id: 'animation',
	background: {
		type: 'forest',
		color: '#2d5016'
	},
	audio: {
		timings: [
			{
				time: 1.0,
				text: {
					kr: '어느 날, 어머니는 떡을 가지고 산을 넘고 있었어요.',
					en: 'Suddenly, a big tiger appeared with a "Roar!"'
				}
			},
			{
				time: 4.0,
				text: {
					kr: '그 때, 갑자기 커다란 호랑이가 어흥! 하고 나타났어요.',
					en: 'Suddenly, a big tiger appeared with a "Roar!"'
				}
			},
			{
				time: 7.0,
				text: {
					kr: '어머니는 깜짝 놀라 벌러덩 넘어졌지요. "떡 하나 주면 안 잡아먹지." 호랑이가 쉰 목소리로 말했어요.',
					en: 'The mother was so scared she fell over. "Give me a rice cake, and I won\'t eat you," said the tiger in a raspy voice.'
				}
			},
			{
				time: 14.0,
				text: {
					kr: '어머니는 떡 하나를 주었어요.',
					en: 'The mother gave him a rice cake.'
				}
			},
			{
				time: 19.0,
				text: {
					kr: '호랑이는 떡을 먹고 어머니를 놓아주었어요.',
					en: 'The tiger ate the rice cake and let the mother go.'
				}
			}
		]
	},
	characters: {
		tiger: {
			x: 800,
			y: 200,
			width: 400,
			height: 400,
			visible: false,
			mouthOpen: false,
			animationState: 'idle',
			color: '#ff8800'
		},
		mother: {
			x: 100,
			y: 200,
			width: 200,
			height: 400,
			visible: true,
			animationState: 'walking',
			color: '#8b4513'
		},
		riceCake: {
			x: 250,
			y: 350,
			width: 40,
			height: 30,
			visible: false,
			draggable: false,
			color: '#fff8dc',
			id: 'riceCake-0',
			fed: false
		},
		riceCakes: [
			{ id: 'riceCake-1', x: 300, y: 500, width: 120, height: 90, visible: false, draggable: false, color: '#fff8dc', fed: false }
		]
	},
	interactions: [
		{
			id: 'feed-tiger',
			type: 'drag-drop',
			trigger: 'riceCakeVisible',
			dropZone: {
				id: 'tiger-mouth',
				x: 675,
				y: 280,
				width: 50,
				height: 40
			},
			successCallback: 'tigerEats'
		}
	],
	culturalDictionary: [
		{
			term: '고개',
			definition: {
				kr: '산을 넘어가는 높고 꼬불꼬불한 길이에요.',
				en: 'A high, winding path that goes over a mountain.'
			}
		}
	],
	parentTips: [
		{
			text: {
				kr: '"호랑이 목소리가 어때? 배고픈 것 같아요, 화난 것 같아?"',
				en: '"What does the tiger\'s voice sound like? Does it seem hungry, or angry?"'
			},
			trigger: 'tigerSpeaks'
		}
	]
};

