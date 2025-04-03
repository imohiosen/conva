import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateAudio, getVoiceForSpeaker, cacheAudio, loadScenarios } from '@/lib/api';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const scenarioId = searchParams.get('scenarioId');
  const index = searchParams.get('index');
  
  if (!scenarioId || index === null) {
    return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
  }
  
  try {
    // Check if cached file exists
    const cacheDir = path.join(process.cwd(), 'public', 'audio-cache');
    const fileName = `${scenarioId}_${index}.mp3`;
    const filePath = path.join(cacheDir, fileName);
    const publicPath = `/audio-cache/${fileName}`;
    
    if (fs.existsSync(filePath)) {
      return NextResponse.json({ url: publicPath });
    }
    
    // If not cached, generate audio
    const scenarios = await loadScenarios();
    const scenario = scenarios[scenarioId];
    
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }
    
    let text: string;
    let speakerId: number;
    
    if (index === 'summary') {
      text = scenario.summary;
      speakerId = 2; // Use narrator voice for summary
    } else {
      const conversationIndex = parseInt(index, 10);
      if (isNaN(conversationIndex) || conversationIndex >= scenario.conversation.length) {
        return NextResponse.json({ error: 'Invalid conversation index' }, { status: 400 });
      }
      
      text = scenario.conversation[conversationIndex].text;
      speakerId = scenario.conversation[conversationIndex].speaker_id;
    }
    
    const voice = getVoiceForSpeaker(speakerId);
    const audioUrl = await generateAudio(text, voice);
    const cachedUrl = await cacheAudio(audioUrl, scenarioId, index === 'summary' ? 'summary' : parseInt(index, 10));
    
    return NextResponse.json({ url: cachedUrl });
  } catch (error) {
    console.error('Error generating audio:', error);
    return NextResponse.json({ error: 'Failed to generate audio' }, { status: 500 });
  }
}
