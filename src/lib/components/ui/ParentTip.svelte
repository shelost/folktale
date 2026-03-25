<script lang="ts">
	import ParentTipPanel from '$lib/components/ui/ParentTipPanel.svelte';
	import { scene3Data } from '$lib/data/scene3';
</script>

<ParentTipPanel tips={scene3Data.parentTips} mode="scene3" />
