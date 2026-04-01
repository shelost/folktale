<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	:global(html),
	:global(body) {
		margin: 0;
		padding: 0;
		overflow: hidden;
		font-family: 'Nanum Myeongjo', 'AppleMyungjo', 'Times New Roman', serif;
		background: black;
	}

	:global(*) {
		box-sizing: border-box;
	}

	:global(:root) {
		--storybook-paper: #f2e5c8;
		--storybook-paper-dark: #e6d4ae;
		--storybook-ink: #3f2a18;
		--storybook-accent: #7a2f20;
		--storybook-gold: #b78b2b;
		--storybook-border: #8d6a3f;
	}
</style>
