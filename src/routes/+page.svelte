<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<div class="home-page">
	<h1>Folktale Interactive Story</h1>
	<p>Welcome to the interactive fairytale experience</p>
	<a href="/scene3" class="start-button">Start Scene 3: 호랑이와의 만남</a>
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

	.start-button {
		display: inline-block;
		margin-top: 2rem;
		padding: 1rem 2rem;
		background: #4a90e2;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-size: 1.2rem;
		font-weight: 600;
		transition: background-color 0.2s, transform 0.2s;
	}

	.start-button:hover {
		background: #357abd;
		transform: scale(1.05);
	}
</style>
