import type {
	TigerState,
	MotherState,
	RiceCakeState,
	Position,
	SceneState
} from '$lib/types/scene';
import type { LoadedImages } from './imageLoader';

export function drawBackground(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	bgColor: string
) {
	// Draw sky gradient
	const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
	skyGradient.addColorStop(0, '#87ceeb');
	skyGradient.addColorStop(1, '#e0f6ff');
	ctx.fillStyle = skyGradient;
	ctx.fillRect(0, 0, width, height * 0.6);

	// Draw ground/forest
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, height * 0.6, width, height * 0.4);

	// Draw mountain peaks (from storyboard)
	const peaks = [
		{ x: 0, height: height * 0.3 },
		{ x: width * 0.2, height: height * 0.25 },
		{ x: width * 0.4, height: height * 0.35 },
		{ x: width * 0.6, height: height * 0.28 },
		{ x: width * 0.8, height: height * 0.32 },
		{ x: width, height: height * 0.3 }
	];

	ctx.fillStyle = '#708090';
	ctx.beginPath();
	ctx.moveTo(0, height * 0.6);
	for (const peak of peaks) {
		ctx.lineTo(peak.x, height * 0.6 - peak.height);
	}
	ctx.lineTo(width, height * 0.6);
	ctx.closePath();
	ctx.fill();

	// Draw some trees
	ctx.fillStyle = '#2d5016';
	for (let i = 0; i < 5; i++) {
		const treeX = (width / 6) * (i + 1);
		const treeY = height * 0.6;
		drawTree(ctx, treeX, treeY, 30 + Math.random() * 20);
	}
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
	// Tree trunk
	ctx.fillStyle = '#654321';
	ctx.fillRect(x - size * 0.1, y - size * 0.3, size * 0.2, size * 0.3);

	// Tree foliage
	ctx.fillStyle = '#2d5016';
	ctx.beginPath();
	ctx.arc(x, y - size * 0.3, size * 0.4, 0, Math.PI * 2);
	ctx.fill();
}

export function drawTiger(ctx: CanvasRenderingContext2D, tiger: TigerState, images: LoadedImages, canvasWidth?: number) {
	if (!tiger.visible) return;

	ctx.save();
	
	// Animation: tiger slides in from the right
	let drawX = tiger.x;
	let drawY = tiger.y;
	
	if (tiger.animationState === 'appearing' && tiger.animationStartTime !== undefined && tiger.finalX !== undefined) {
		const animationDuration = 800; // 800ms animation
		const elapsed = Date.now() - tiger.animationStartTime;
		const progress = Math.min(1, elapsed / animationDuration);
		
		// Ease-out animation (easeOutCubic)
		const easedProgress = 1 - Math.pow(1 - progress, 3);
		
		// Calculate start position (off-screen right) based on canvas width
		// Use canvasWidth if available, otherwise fallback to a reasonable offset
		const startX = canvasWidth && canvasWidth > 0 ? canvasWidth + 50 : (tiger.finalX + 200);
		
		// Interpolate position from startX to finalX
		drawX = startX + (tiger.finalX - startX) * easedProgress;
	} else if (tiger.finalX !== undefined && tiger.animationState !== 'appearing') {
		// Use final position if animation is complete or not started
		drawX = tiger.finalX;
	} else {
		// Fallback to current x position
		drawX = tiger.x;
	}
	
	ctx.translate(drawX, drawY);

	// Draw tiger image if available, otherwise fallback to shape drawing
	if (images.tiger && images.tiger.complete) {
		ctx.drawImage(images.tiger, 0, 0, tiger.width, tiger.height);
		
		// Draw open mouth overlay if eating
		if (tiger.mouthOpen) {
			ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
			ctx.beginPath();
			ctx.ellipse(tiger.width / 2, tiger.height * 0.3, tiger.width * 0.2, tiger.height * 0.15, 0, 0, Math.PI * 2);
			ctx.fill();
		}
	} else {
		// Fallback: draw simple tiger shape if image not loaded
		ctx.fillStyle = tiger.color;
		ctx.beginPath();
		ctx.ellipse(tiger.width / 2, tiger.height / 2, tiger.width / 2, tiger.height / 2, 0, 0, Math.PI * 2);
		ctx.fill();

		// Tiger stripes
		ctx.strokeStyle = '#000';
		ctx.lineWidth = 3;
		for (let i = 0; i < 5; i++) {
			const y = (tiger.height / 6) * (i + 1);
			ctx.beginPath();
			ctx.moveTo(tiger.width * 0.2, y);
			ctx.lineTo(tiger.width * 0.8, y);
			ctx.stroke();
		}

		// Tiger head
		ctx.fillStyle = tiger.color;
		ctx.beginPath();
		ctx.ellipse(tiger.width / 2, tiger.height * 0.2, tiger.width * 0.4, tiger.height * 0.3, 0, 0, Math.PI * 2);
		ctx.fill();

		// Eyes
		ctx.fillStyle = '#fff';
		ctx.beginPath();
		ctx.arc(tiger.width * 0.4, tiger.height * 0.15, 8, 0, Math.PI * 2);
		ctx.arc(tiger.width * 0.6, tiger.height * 0.15, 8, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#000';
		ctx.beginPath();
		ctx.arc(tiger.width * 0.4, tiger.height * 0.15, 5, 0, Math.PI * 2);
		ctx.arc(tiger.width * 0.6, tiger.height * 0.15, 5, 0, Math.PI * 2);
		ctx.fill();

		// Mouth
		if (tiger.mouthOpen) {
			ctx.fillStyle = '#ff0000';
			ctx.beginPath();
			ctx.ellipse(tiger.width / 2, tiger.height * 0.3, tiger.width * 0.2, tiger.height * 0.15, 0, 0, Math.PI * 2);
			ctx.fill();
		} else {
			ctx.strokeStyle = '#000';
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.arc(tiger.width / 2, tiger.height * 0.3, tiger.width * 0.15, 0, Math.PI);
			ctx.stroke();
		}
	}

	ctx.restore();
}

export function drawMother(ctx: CanvasRenderingContext2D, mother: MotherState, images: LoadedImages) {
	if (!mother.visible) return;

	ctx.save();
	ctx.translate(mother.x, mother.y);

	// Rotate if falling
	if (mother.animationState === 'falling') {
		// Animate fall rotation
		const rotation = Math.min(Math.PI / 6, (Date.now() % 2000) / 2000 * Math.PI / 6);
		ctx.rotate(rotation);
		ctx.translate(0, (Date.now() % 2000) / 2000 * 50); // Fall down
	} else if (mother.animationState === 'fallen') {
		ctx.rotate(Math.PI / 6); // 30 degrees - fully fallen
		ctx.translate(0, 50); // Fallen position
	}

	// Draw mother image if available, otherwise fallback to shape drawing
	if (images.mother && images.mother.complete) {
		ctx.drawImage(images.mother, 0, 0, mother.width, mother.height);
	} else {
		// Fallback: draw simple mother shape if image not loaded
		ctx.fillStyle = mother.color;
		ctx.fillRect(0, 0, mother.width, mother.height);

		// Head
		ctx.fillStyle = '#ffdbac';
		ctx.beginPath();
		ctx.arc(mother.width / 2, -mother.height * 0.2, mother.width * 0.3, 0, Math.PI * 2);
		ctx.fill();

		// Simple face
		ctx.fillStyle = '#000';
		ctx.beginPath();
		ctx.arc(mother.width * 0.4, -mother.height * 0.25, 3, 0, Math.PI * 2);
		ctx.arc(mother.width * 0.6, -mother.height * 0.25, 3, 0, Math.PI * 2);
		ctx.fill();
	}

	ctx.restore();
}

export function drawRiceCake(
	ctx: CanvasRenderingContext2D,
	riceCake: RiceCakeState,
	dragPosition?: Position | null
) {
	if (!riceCake.visible) return;

	// If fed, always use the rice cake's position (it's already at the tiger's mouth)
	// If not fed and dragging, use drag position
	const x = riceCake.fed ? riceCake.x : (dragPosition?.x ?? riceCake.x);
	const y = riceCake.fed ? riceCake.y : (dragPosition?.y ?? riceCake.y);

	ctx.save();
	ctx.translate(x, y);

	// Rice cake (white/beige rounded rectangle)
	ctx.fillStyle = riceCake.color;
	ctx.beginPath();
	// Draw rounded rectangle manually for compatibility
	const radius = 5;
	ctx.moveTo(radius, 0);
	ctx.lineTo(riceCake.width - radius, 0);
	ctx.quadraticCurveTo(riceCake.width, 0, riceCake.width, radius);
	ctx.lineTo(riceCake.width, riceCake.height - radius);
	ctx.quadraticCurveTo(riceCake.width, riceCake.height, riceCake.width - radius, riceCake.height);
	ctx.lineTo(radius, riceCake.height);
	ctx.quadraticCurveTo(0, riceCake.height, 0, riceCake.height - radius);
	ctx.lineTo(0, radius);
	ctx.quadraticCurveTo(0, 0, radius, 0);
	ctx.closePath();
	ctx.fill();

	// Outline
	ctx.strokeStyle = '#d4a574';
	ctx.lineWidth = 2;
	ctx.stroke();

	ctx.restore();
}

export function drawBowl(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
	ctx.save();
	ctx.translate(x, y);

	// Bowl (semi-circle with base)
	ctx.fillStyle = '#f5deb3';
	ctx.strokeStyle = '#000';
	ctx.lineWidth = 2;

	// Bowl shape
	ctx.beginPath();
	ctx.arc(width / 2, 0, width / 2, 0, Math.PI);
	ctx.lineTo(0, height);
	ctx.lineTo(width, height);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	ctx.restore();
}

export function drawScene(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	scene: SceneState,
	bgColor: string,
	images: LoadedImages,
	dragPosition?: Position | null,
	draggingCakeId?: string | null
) {
	// Clear canvas
	ctx.clearRect(0, 0, width, height);

	// Draw background
	drawBackground(ctx, width, height, bgColor);

	// Draw characters in order (back to front)
	drawMother(ctx, scene.characters.mother, images);
	
	// Draw bowl with rice cakes if in rice cake phase
	if (scene.characters.riceCakes && scene.characters.riceCakes.length > 0 && scene.characters.riceCakes.some(rc => rc.visible)) {
		const bowlX = scene.characters.mother.x + scene.characters.mother.width / 2 - 80;
		const bowlY = scene.characters.mother.y + scene.characters.mother.height - 40;
		drawBowl(ctx, bowlX, bowlY, 160, 50); // Larger bowl to match larger sprites
	}
	
	drawTiger(ctx, scene.characters.tiger, images, width);
	
	// Draw all rice cakes
	// Draw unfed rice cakes first (so they appear behind fed ones)
	if (scene.characters.riceCakes) {
		// Draw unfed rice cakes (draggable ones)
		scene.characters.riceCakes.forEach((riceCake) => {
			if (!riceCake.fed) {
				const isDragging = draggingCakeId === riceCake.id;
				drawRiceCake(ctx, riceCake, isDragging ? dragPosition : null);
			}
		});
		// Draw fed rice cakes (in tiger's mouth)
		scene.characters.riceCakes.forEach((riceCake) => {
			if (riceCake.fed) {
				drawRiceCake(ctx, riceCake, null);
			}
		});
	}
}

