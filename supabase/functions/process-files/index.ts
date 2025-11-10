import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request to process files');
    
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const userGeminiKey = formData.get('geminiApiKey') as string | null;
    const userOpenAIKey = formData.get('openaiApiKey') as string | null;

    console.log(`Processing ${files.length} files`);
    console.log('User provided Gemini key:', userGeminiKey ? 'Yes' : 'No');
    console.log('User provided OpenAI key:', userOpenAIKey ? 'Yes' : 'No');

    // Use user-provided keys or fall back to server keys
    const geminiApiKey = userGeminiKey || Deno.env.get('GEMINI_API_KEY');
    const openaiApiKey = userOpenAIKey || Deno.env.get('OPENAI_API_KEY');

    if (!geminiApiKey) {
      throw new Error('Gemini API key is required. Please provide your API key in settings.');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate files
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    // Create processing job
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .insert({
        file_names: files.map(f => f.name),
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      console.error('Error creating job:', jobError);
      throw new Error(`Failed to create processing job: ${jobError.message}`);
    }

    console.log(`Created job ${job.id}`);

    // Process files in background (don't await)
    processFilesBackground(job.id, files, geminiApiKey, openaiApiKey, supabase);

    return new Response(JSON.stringify({ jobId: job.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-files:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
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
    console.log(`Starting background processing for job ${jobId}`);
    const allTranscriptions: string[] = [];

    for (const file of files) {
      console.log(`Processing file: ${file.name} (${file.type})`);
      try {
        const transcription = await extractText(file, openaiApiKey);
        allTranscriptions.push(`\n--- ${file.name} ---\n${transcription}`);
        console.log(`Successfully processed ${file.name}`);
      } catch (fileError) {
        console.error(`Error processing ${file.name}:`, fileError);
        allTranscriptions.push(`\n--- ${file.name} ---\nError processing file: ${fileError.message}`);
      }
    }

    const combinedText = allTranscriptions.join('\n\n');
    console.log(`Combined text length: ${combinedText.length} characters`);

    if (combinedText.length < 10) {
      throw new Error('No meaningful text could be extracted from the files');
    }

    // Translate to Bengali
    console.log('Starting translation...');
    const translation = await translateText(combinedText, geminiApiKey);
    console.log('Translation completed');

    // Generate summary in Bengali
    console.log('Generating summary...');
    const summary = await generateSummary(combinedText, geminiApiKey);
    console.log('Summary completed');

    // Update job with results
    const { error: updateError } = await supabase
      .from('processing_jobs')
      .update({
        transcription: combinedText,
        translation: translation,
        summary: summary,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);

    if (updateError) {
      throw new Error(`Failed to update job: ${updateError.message}`);
    }

    console.log(`Job ${jobId} completed successfully`);
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    await supabase
      .from('processing_jobs')
      .update({
        error: errorMessage,
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }
}

async function extractText(file: File, openaiApiKey: string | null): Promise<string> {
  const fileType = file.type;
  console.log(`Extracting text from ${file.name} (${fileType})`);

  // Handle PDF files
  if (fileType === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const decoder = new TextDecoder('utf-8');
      let text = decoder.decode(uint8Array);
      
      // Simple PDF text extraction (removes binary data)
      text = text.replace(/[^\x20-\x7E\n]/g, ' ');
      text = text.replace(/\s+/g, ' ').trim();
      
      if (text.length < 50) {
        throw new Error('PDF appears to be empty or contains only images. Please provide a PDF with text content.');
      }
      
      return text.slice(0, 50000); // Limit to 50k chars
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  // Handle audio/video files with Whisper
  if (fileType.startsWith('audio/') || fileType.startsWith('video/')) {
    if (!openaiApiKey) {
      throw new Error('OpenAI API key is required for audio/video transcription. Please provide it in settings.');
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('language', 'en');
      formData.append('response_format', 'text');

      console.log('Calling Whisper API...');
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Whisper API error:', errorText);
        throw new Error(`Whisper API failed: ${response.status} - ${errorText}`);
      }

      const transcription = await response.text();
      console.log(`Whisper transcription length: ${transcription.length}`);
      return transcription;
    } catch (error) {
      throw new Error(`Failed to transcribe audio/video: ${error.message}`);
    }
  }

  throw new Error(`Unsupported file type: ${fileType}. Supported types: PDF, audio, and video files.`);
}

async function translateText(text: string, geminiApiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Translate the following text into সহজ বাংলা (simple Bengali). Maintain the meaning and keep it natural and easy to understand. Do not add any explanations, just provide the translation:\n\n${text.slice(0, 30000)}`
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
      const errorText = await response.text();
      console.error('Gemini translation error:', errorText);
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error(`Translation failed: ${error.message}`);
  }
}

async function generateSummary(text: string, geminiApiKey: string): Promise<string> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Provide a comprehensive summary and explanation in সহজ বাংলা (simple Bengali) of the following content. Include:
1. মূল বিষয় এবং গুরুত্বপূর্ণ পয়েন্ট (Main topics and key points)
2. গুরুত্বপূর্ণ বিবরণ এবং অর্থ (Important details and meanings)
3. প্রসঙ্গ এবং তাৎপর্য (Context and significance)
4. কোনো কার্যকর অন্তর্দৃষ্টি (Any actionable insights)

Content to summarize:\n\n${text.slice(0, 30000)}`
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
      const errorText = await response.text();
      console.error('Gemini summary error:', errorText);
      throw new Error(`Summary generation failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    throw new Error(`Summary generation failed: ${error.message}`);
  }
}
