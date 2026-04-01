<script lang="ts">
	import { browser } from '$app/environment';
	import { Canvas, T } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';

	let {
		opening = false,
		closing = false,
		onComplete,
		onClose,
		onClick
	}: {
		opening?: boolean;
		closing?: boolean;
		onComplete?: () => void;
		onClose?: () => void;
		onClick?: () => void;
	} = $props();

	let progress = $state(0);
	let rafId: number | null = null;
	let lastTs = 0;
	let sentComplete = false;
	let sentClose = false;
	let textureReady = $state(false);
	let imageAspect = $state(1);

	const maxPlaneW = 2.95;
	const maxPlaneH = 3.95;
	const planeWidth = $derived(
		imageAspect > maxPlaneW / maxPlaneH ? maxPlaneW : maxPlaneH * imageAspect
	);
	const planeHeight = $derived(
		imageAspect > maxPlaneW / maxPlaneH ? maxPlaneW / imageAspect : maxPlaneH
	);

	const coverTexture = browser
		? new THREE.TextureLoader().load('/haetnim.png', (texture) => {
				texture.colorSpace = THREE.SRGBColorSpace;
				texture.anisotropy = 8;
				texture.needsUpdate = true;
				const w = texture.image.naturalWidth || texture.image.width;
				const h = texture.image.naturalHeight || texture.image.height;
				if (w && h) imageAspect = w / h;
				textureReady = true;
			})
		: null;

	function easeInOutCubic(t: number): number {
		return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
	}

	function stopLoop() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function startLoop() {
		stopLoop();
		lastTs = 0;

		const tick = (ts: number) => {
			const isIdle = !opening && !closing;
			if (isIdle && progress <= 0.001) {
				stopLoop();
				return;
			}
			if (isIdle && progress >= 0.999) {
				stopLoop();
				return;
			}

			if (!lastTs) {
				lastTs = ts;
			}

			const dt = Math.min(0.05, (ts - lastTs) / 1000);
			lastTs = ts;

			if (opening) {
				progress = Math.min(1, progress + dt * 1.05);
			} else if (closing) {
				progress = Math.max(0, progress - dt * 1.2);
			}

			if (opening && progress >= 0.70 && !sentComplete) {
				sentComplete = true;
				onComplete?.();
			}

			if (closing && progress <= 0.01 && !sentClose) {
				sentClose = true;
				onClose?.();
			}

			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
	}

	$effect(() => {
		if (opening) {
			sentComplete = false;
			startLoop();
		}
	});

	$effect(() => {
		if (closing) {
			sentClose = false;
			progress = 1;
			startLoop();
		}
	});

	onDestroy(() => {
		stopLoop();
	});

	const eased = $derived(easeInOutCubic(progress));
	const coverRotationY = $derived(-0.22 - eased * 2.35);
	const bookScale = $derived(0.82 + eased * 0.45);
	const bookPositionZ = $derived(eased * 3.0);
	const bookPositionX = $derived(eased * 1.6);
	const bookTiltX = $derived(-0.08 + eased * 0.02);

	const isClickable = $derived(!opening && !closing);
</script>

{#if browser}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="three-wrap"
		class:clickable={isClickable}
		aria-hidden="true"
		onpointerdown={isClickable ? onClick : undefined}
	>
		<Canvas dpr={1.5}>
			<T.PerspectiveCamera makeDefault position={[0, 0.36, 11.2]} fov={36} />
			<T.HemisphereLight skyColor="#f7e8cf" groundColor="#6a4b35" intensity={0.9} />
			<T.AmbientLight intensity={0.85} />
			<T.DirectionalLight position={[2, 3, 4]} intensity={0.72} color="#ffe5c1" />
			<T.DirectionalLight position={[-2.5, 2, -2]} intensity={0.35} color="#f3d0a8" />

			<T.Group scale={bookScale} rotation.x={bookTiltX} position.z={bookPositionZ} position.x={bookPositionX}>
				<T.Mesh position={[0, -0.04, -0.22]}>
					<T.BoxGeometry args={[3.45, 4.9, 0.34]} />
					<T.MeshStandardMaterial color="#ebdcc0" roughness={0.95} metalness={0.0} />
				</T.Mesh>

				<T.Mesh position={[-1.83, 0, 0]}>
					<T.BoxGeometry args={[0.18, 5.05, 0.42]} />
					<T.MeshStandardMaterial color="#5a3522" roughness={0.92} metalness={0.0} />
				</T.Mesh>

				<T.Group position={[-1.78, 0, 0.02]} rotation.y={coverRotationY}>
					<T.Mesh position={[1.7, 0, 0]}>
						<T.BoxGeometry args={[3.4, 5.05, 0.1]} />
						<T.MeshStandardMaterial color="#71412a" roughness={0.94} metalness={0.0} />
					</T.Mesh>

					<T.Mesh position={[1.7, 0, 0.055]}>
						<T.PlaneGeometry args={[planeWidth, planeHeight]} />
						<T.MeshStandardMaterial
							transparent
							opacity={textureReady ? 1 : 0}
							map={coverTexture}
							roughness={0.98}
							metalness={0.0}
							side={THREE.DoubleSide}
							color="#fff6de"
						/>
					</T.Mesh>
				</T.Group>
			</T.Group>
		</Canvas>
		{#if !textureReady}
			<img class="title-fallback" src="/haetnim.png" alt="" />
		{/if}
	</div>
{/if}

<style>
	.three-wrap {
		width: 100vw;
		height: 100vh;
		pointer-events: none;
		position: relative;
	}

	.three-wrap.clickable {
		pointer-events: auto;
		cursor: pointer;
	}

	.title-fallback {
		position: absolute;
		left: 50%;
		top: 50%;
		width: min(300px, 36vw);
		transform: translate(-50%, -58%);
		filter: drop-shadow(0 4px 10px rgba(35, 20, 12, 0.35));
		pointer-events: none;
		opacity: 0.95;
	}
</style>
