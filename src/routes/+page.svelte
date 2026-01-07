<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="home-page">
	<h1>Folktale Interactive Story</h1>
	<p>Welcome to the interactive fairytale experience</p>
	<div class="scene-buttons">
		<a href="/scene3" class="start-button">Start Scene 3: 호랑이와의 만남</a>
		<a href="/animation" class="start-button">Animation Scene: Video-based Story</a>
	</div>
</div>

<style>
	.home-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		padding: 2rem;
		text-align: center;
	}

	.scene-buttons {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		align-items: center;
		margin-top: 2rem;
	}

	.start-button {
		display: inline-block;
		padding: 1rem 2rem;
		background: #4a90e2;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-size: 1.2rem;
		font-weight: 600;
		transition: background-color 0.2s, transform 0.2s;
		min-width: 300px;
		text-align: center;
	}

	.start-button:hover {
		background: #357abd;
		transform: scale(1.05);
	}
</style>
