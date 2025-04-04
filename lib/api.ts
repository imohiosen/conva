import { fal } from "@fal-ai/client";
import fs from 'fs';
import path from 'path';
import { ScenariosData, Conversation } from './types';

// Initialize FAL client if api key exists
if (process.env.FAL_KEY) {
  fal.config({
    credentials: process.env.FAL_KEY
  });
}

// Load scenarios data from the data.json.mdc file
export async function loadScenarios(): Promise<ScenariosData> {
  try {
    const filePath = path.join(process.cwd(), 'rules', 'data.json.mdc');
    const fileContent = await fs.promises.readFile(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error loading scenarios data:', error);
    return {};
  }
}

// Generate audio from text using the FAL API
export async function generateAudio(text: string, voice: string): Promise<string> {
  try {
    const result = await fal.subscribe("fal-ai/elevenlabs/tts/multilingual-v2", {
      input: {
        text,
        voice,
        stability: 0.5,
        similarity_boost: 0.75
      },
    });
    
    return result.data.audio.url;
  } catch (error) {
    console.error('Error generating audio:', error);
    throw error;
  }
}

// Select voice based on speaker ID
export function getVoiceForSpeaker(speakerId: number): string {
  switch (speakerId) {
    case 0:
      return "Liam";
    case 1:
      return "Aria";
    default:
      return "Daniel"; // For summary or fallback
  }
}

// Cache audio files locally
export async function cacheAudio(url: string, scenarioId: string, index: number|string): Promise<string> {
  const cacheDir = path.join(process.cwd(), 'public', 'audio-cache');
  const fileName = `${scenarioId}_${index}.mp3`;
  const filePath = path.join(cacheDir, fileName);
  const publicPath = `/audio-cache/${fileName}`;
  
  // Create cache directory if it doesn't exist
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    return publicPath;
  }
  
  // Download and save the file
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(filePath, buffer);
    return publicPath;
  } catch (error) {
    console.error('Error caching audio:', error);
    return url; // Return original URL if caching fails
  }
}
