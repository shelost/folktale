<script lang="ts">
	import CulturalDictionaryPanel from '$lib/components/ui/CulturalDictionaryPanel.svelte';
	import { scene3Data } from '$lib/data/scene3';
</script>

<CulturalDictionaryPanel entries={scene3Data.culturalDictionary} />
