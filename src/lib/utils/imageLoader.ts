import { browser } from '$app/environment';

export interface LoadedImages {
	tiger: HTMLImageElement | null;
	mother: HTMLImageElement | null;
}

let cachedImages: LoadedImages = {
	tiger: null,
	mother: null
};

let imagesLoaded = false;
let loadingPromise: Promise<LoadedImages> | null = null;

export function loadImages(): Promise<LoadedImages> {
	if (!browser) {
		return Promise.resolve({ tiger: null, mother: null });
	}

	if (imagesLoaded && cachedImages.tiger && cachedImages.mother) {
		return Promise.resolve(cachedImages);
	}

	if (loadingPromise) {
		return loadingPromise;
	}

	loadingPromise = new Promise((resolve, reject) => {
		const tigerImg = new Image();
		const motherImg = new Image();

		let tigerLoaded = false;
		let motherLoaded = false;

		function checkComplete() {
			if (tigerLoaded && motherLoaded) {
				cachedImages = {
					tiger: tigerImg,
					mother: motherImg
				};
				imagesLoaded = true;
				resolve(cachedImages);
			}
		}

		tigerImg.onload = () => {
			tigerLoaded = true;
			checkComplete();
		};
		tigerImg.onerror = () => {
			console.error('Failed to load tiger image');
			tigerLoaded = true; // Continue even if image fails
			checkComplete();
		};

		motherImg.onload = () => {
			motherLoaded = true;
			checkComplete();
		};
		motherImg.onerror = () => {
			console.error('Failed to load mother image');
			motherLoaded = true; // Continue even if image fails
			checkComplete();
		};

		tigerImg.src = '/tiger.png';
		motherImg.src = '/mother.png';
	});

	return loadingPromise;
}

export function getImages(): LoadedImages {
	return cachedImages;
}

