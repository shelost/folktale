import type { SceneData } from '$lib/types/scene';

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
			{ id: 'riceCake-1', x: 450, y: 250, width: 120, height: 90, visible: false, draggable: false, color: '#fff8dc', fed: false }
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
		},
		{
			term: '떡',
			definition: {
				kr: '쌀로 만든 한국 전통 음식이에요. 명절이나 생일 같은 특별한 날에 먹어요.',
				en: "A traditional Korean food made from rice. It's eaten on special occasions like holidays and birthdays."
			},
			image: '/tteok.png'
		},
		{
			term: '호랑이',
			definition: {
				kr: '한국 전래동화에 자주 등장하는 동물이에요. 무섭지만 때로는 어리석은 모습을 보여줘요.',
				en: "An animal that often appears in Korean folktales. It's scary but sometimes shown as foolish."
			},
			image: '/tiger.png'
		},
		{
			term: '어머니',
			definition: {
				kr: '한국 문화에서 어머니는 가족을 위해 희생하는 사랑의 상징이에요.',
				en: 'In Korean culture, mothers symbolize sacrificial love for their family.'
			},
			image: '/mother.png'
		},
		{
			term: '정',
			definition: {
				kr: '한국 사람들 사이의 깊은 정서적 유대감이에요. 가족, 친구, 이웃 간의 따뜻한 마음을 뜻해요.',
				en: 'A deep emotional bond between Korean people. It refers to the warm affection shared among family, friends, and neighbors.'
			}
		}
	],
	parentTips: [
		{
			text: {
				kr: '"호랑이 목소리가 어때? 배고픈 것 같아요, 화난 것 같아?"',
				en: '"What does the tiger\'s voice sound like? Does it seem hungry, or angry?"'
			},
			description: {
				kr: '아이가 등장인물의 감정과 분위기에 주목하도록 유도합니다.',
				en: "Encourages your child to notice the character's feelings and tone."
			},
			trigger: 'tigerSpeaks'
		},
		{
			text: {
				kr: "아이에게 물어보세요: '어머니가 왜 이 힘든 산길을 떡을 머리에 이고 가고 있을까?'",
				en: "Ask your child: 'Why do you think the mother is carrying rice cakes on her head up this difficult mountain path?'"
			},
			description: {
				kr: '한국 부모님의 희생과 사랑이라는 정서적 가치(Jeong)를 아이가 느끼게 합니다.',
				en: 'This helps the child feel the emotional value of sacrifice and love (Jeong) that Korean parents embody.'
			},
			trigger: 'motherWalking'
		},
		{
			text: {
				kr: "아이에게 사진 속 '떡'을 가리키며 말해주세요: '우리는 언제 떡을 먹었지? 지난번 추석(또는 생일) 때 기억나?'",
				en: "Point to the rice cake on screen and say: 'When did we last eat tteok? Do you remember during Chuseok (or your birthday)?'"
			},
			description: {
				kr: '아이의 실제 경험과 이야기를 연결하여 한국 문화를 가깝게 느끼게 합니다.',
				en: 'This connects the child\'s real experiences to the story, making Korean culture feel closer.'
			},
			trigger: 'riceCakeVisible'
		},
		{
			text: {
				kr: "떡이 소쿠리에 몇 개 있는지 함께 세어 보세요. 그리고 호랑이를 눌러 보기도 하면서 자유롭게 이야기를 탐구하도록 해 주세요. 그리고 '다음 고개에는 누가 나타날까?'라고 추측하며 긴장감을 조성해 보세요.",
				en: "Count the rice cakes in the basket together. Let your child freely explore the story by tapping the tiger. Then build suspense by guessing: 'Who will appear at the next mountain pass?'"
			},
			description: {
				kr: "부모를 '이야기꾼(Storyteller)'으로 만들어 아이와 함께 이야기의 몰입도를 높입니다.",
				en: "This turns the parent into a 'Storyteller,' deepening the child's engagement with the story."
			},
			trigger: 'riceCakeVisible'
		}
	],
	bookIllustrations: []
};

