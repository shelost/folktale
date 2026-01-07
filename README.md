# Folktale Interactive Story

An interactive storytelling application built with SvelteKit and Svelte 5.

## Features

- Interactive scene progression with step-based navigation
- Bilingual support (Korean and English)
- Audio narration using OpenAI Text-to-Speech
- Drag-and-drop interactions
- Cultural dictionary and parent tips

## Setup

1. Install dependencies:

```sh
npm install
```

2. Configure environment variables:

Create a `.env` file in the root directory with your OpenAI API key:

```
OPENAI_API_KEY=your_openai_api_key_here
```

Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

3. Start the development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Audio Narration

The app uses OpenAI's Text-to-Speech API to generate audio narrations for each slide's captions. Audio files are cached in the browser's IndexedDB for performance. The narration automatically plays when slides change and adapts to the selected language (Korean or English).
