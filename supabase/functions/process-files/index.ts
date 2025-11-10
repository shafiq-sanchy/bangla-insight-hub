import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const userGeminiKey = formData.get('geminiApiKey') as string | null;
    const userOpenAIKey = formData.get('openaiApiKey') as string | null;

    // Use user-provided keys or fall back to server keys
    const geminiApiKey = userGeminiKey || Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = userOpenAIKey || Deno.env.get('OPENAI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create processing job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        file_names: files.map(f => f.name),
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) throw jobError;

    console.log(`Processing job ${job.id} created for ${files.length} files`);

    // Process files in background
    processFilesBackground(job.id, files, geminiApiKey, openaiApiKey || null, supabase);

    return new Response(JSON.stringify({ jobId: job.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processFilesBackground(
  jobId: string,
  files: File[],
  geminiApiKey: string,
  openaiApiKey: string | null,
  supabase: any
) {
  try {
    const allTranscriptions: string[] = [];

    for (const file of files) {
      console.log(`Processing file: ${file.name}`);
      const transcription = await extractText(file, openaiApiKey);
      allTranscriptions.push(`\n--- ${file.name} ---\n${transcription}`);
    }

    const combinedText = allTranscriptions.join('\n\n');
    console.log(`Combined text length: ${combinedText.length} characters`);

    // Translate to Bengali
    const translation = await translateText(combinedText, geminiApiKey);

    // Generate summary in Bengali
    const summary = await generateSummary(combinedText, geminiApiKey);

    // Update job with results
    await supabase
      .from('processing_jobs')
      .update({
        transcription: combinedText,
        translation: translation,
        summary: summary,
        status: 'completed'
      })
      .eq('id', jobId);

    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabase
      .from('processing_jobs')
      .update({
        error: errorMessage,
        status: 'failed'
      })
      .eq('id', jobId);
  }
}

async function extractText(file: File, openaiApiKey: string | null): Promise<string> {
  const fileType = file.type;

  // Handle PDF files
  if (fileType === 'application/pdf') {
    // For PDF, we'll extract text using a simple approach
    // In production, you'd use a proper PDF parsing library
    const arrayBuffer = await file.arrayBuffer();
    const text = new TextDecoder().decode(arrayBuffer);
    // This is a simplified extraction - in production use a proper PDF parser
    return `[PDF content from ${file.name}]\n${text.slice(0, 10000)}`;
  }

  // Handle audio/video files with Whisper
  if (fileType.startsWith('audio/') || fileType.startsWith('video/')) {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key required for audio/video transcription');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'text');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Whisper API error: ${error}`);
    }

    return await response.text();
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}

async function translateText(text: string, geminiApiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Translate the following text into সহজ বাংলা (simple Bengali). Maintain the meaning and keep it natural and easy to understand:\n\n${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8000,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini translation error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function generateSummary(text: string, geminiApiKey: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Provide a comprehensive summary and explanation in সহজ বাংলা (simple Bengali) of the following content. Include:
1. Main topics and key points
2. Important details and meanings
3. Context and significance
4. Any actionable insights

Content to summarize:\n\n${text}`
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 8000,
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini summary error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}
