import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, language, voice, model = 'tts-1' } = await request.json();

		if (!text || typeof text !== 'string') {
			return json({ error: 'Text is required' }, { status: 400 });
		}

		if (!language || !['kr', 'en'].includes(language)) {
			return json({ error: 'Language must be "kr" or "en"' }, { status: 400 });
		}

		const apiKey = env.OPENAI_API_KEY;
		if (!apiKey) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		// Select voice based on language if not provided
		const selectedVoice = voice || (language === 'kr' ? 'nova' : 'alloy');

		// Call OpenAI TTS API
		const response = await fetch('https://api.openai.com/v1/audio/speech', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model,
				voice: selectedVoice,
				input: text,
				response_format: 'mp3',
				speed: 1.0
			})
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error('OpenAI TTS API error:', errorData);
			return json(
				{ error: 'Failed to generate speech', details: errorData },
				{ status: response.status }
			);
		}

		// Get audio blob
		const audioBlob = await response.blob();

		// Convert blob to base64 for transmission
		const arrayBuffer = await audioBlob.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);
		const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
		const base64 = btoa(binary);

		return json({
			audio: base64,
			format: 'mp3',
			voice: selectedVoice
		});
	} catch (error) {
		console.error('TTS generation error:', error);
		return json(
			{ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
			{ status: 500 }
		);
	}
};

