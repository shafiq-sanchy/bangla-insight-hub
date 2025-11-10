import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { Results } from "@/components/Results";
import { ApiSettings } from "@/components/ApiSettings";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ProcessingResult = {
  transcription: string;
  translation: string;
  summary: string;
};

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<{ geminiApiKey?: string; openaiApiKey?: string }>({});

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setResults(null);
    
    try {
      console.log('Preparing to upload files:', files.map(f => f.name));
      
      // Validate files
      if (!files || files.length === 0) {
        throw new Error('No files selected');
      }

      // Check file types
      const invalidFiles = files.filter(file => {
        const type = file.type;
        return !type.startsWith('audio/') && 
               !type.startsWith('video/') && 
               type !== 'application/pdf';
      });

      if (invalidFiles.length > 0) {
        throw new Error(`Unsupported file types: ${invalidFiles.map(f => f.name).join(', ')}`);
      }

      // Prepare form data
      const formData = new FormData();
      files.forEach(file => {
        console.log(`Adding file: ${file.name} (${file.type}, ${file.size} bytes)`);
        formData.append('files', file);
      });
      
      // Add API keys if provided
      if (apiKeys.geminiApiKey) {
        console.log('Adding user Gemini API key');
        formData.append('geminiApiKey', apiKeys.geminiApiKey);
      }
      if (apiKeys.openaiApiKey) {
        console.log('Adding user OpenAI API key');
        formData.append('openaiApiKey', apiKeys.openaiApiKey);
      }

      // Call edge function
      console.log('Calling process-files edge function...');
      const { data, error } = await supabase.functions.invoke('process-files', {
        body: formData,
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to start processing');
      }

      if (!data || !data.jobId) {
        throw new Error('No job ID returned from server');
      }

      const newJobId = data.jobId;
      console.log('Job created:', newJobId);
      setJobId(newJobId);
      toast.success('Processing started!');

      // Poll for results
      let attempts = 0;
      const maxAttempts = 200; // 200 * 3 seconds = 10 minutes
      
      const pollInterval = setInterval(async () => {
        attempts++;
        console.log(`Polling attempt ${attempts}/${maxAttempts}`);

        try {
          const { data: job, error: jobError } = await supabase
            .from('processing_jobs')
            .select('*')
            .eq('id', newJobId)
            .single();

          if (jobError) {
            console.error('Error fetching job:', jobError);
            clearInterval(pollInterval);
            toast.error('Error checking job status');
            setIsProcessing(false);
            return;
          }

          console.log('Job status:', job.status);

          if (job.status === 'completed') {
            clearInterval(pollInterval);
            
            if (!job.transcription || !job.translation || !job.summary) {
              toast.error('Processing completed but results are incomplete');
              setIsProcessing(false);
              return;
            }

            setResults({
              transcription: job.transcription,
              translation: job.translation,
              summary: job.summary,
            });
            setIsProcessing(false);
            toast.success('Processing completed successfully!');
          } else if (job.status === 'failed') {
            clearInterval(pollInterval);
            const errorMsg = job.error || 'Processing failed';
            console.error('Job failed:', errorMsg);
            toast.error(errorMsg);
            setIsProcessing(false);
          } else if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            toast.error('Processing timeout - taking too long');
            setIsProcessing(false);
          }
        } catch (pollError) {
          console.error('Error during polling:', pollError);
          clearInterval(pollInterval);
          toast.error('Error checking processing status');
          setIsProcessing(false);
        }
      }, 3000); // Poll every 3 seconds

    } catch (error) {
      console.error('Error processing files:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(errorMessage);
      setIsProcessing(false);
    }
  };

  const handleNewUpload = () => {
    setResults(null);
    setJobId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">TranslateBD</h1>
            </div>
            <ApiSettings onKeysChange={setApiKeys} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16">
        {!isProcessing && !results && (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Transcribe, Translate & Understand
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Upload audio, video, or PDF files. Get English transcription, Bengali translation, 
                and detailed summaries in সহজ বাংলা.
              </p>
            </div>

            {/* Upload Section */}
            <FileUpload onFilesSelected={handleFilesSelected} />

            {/* API Key Notice */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                💡 <strong>Tip:</strong> Provide your own API keys in settings to avoid rate limits and ensure faster processing.
              </p>
            </div>

            {/* Features */}
            <div className="mt-16 grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="font-semibold mb-2 text-card-foreground">Transcribe</h3>
                <p className="text-sm text-muted-foreground">
                  Accurate English transcription from audio and video
                </p>
              </div>
              
              <div className="text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🌐</span>
                </div>
                <h3 className="font-semibold mb-2 text-card-foreground">Translate</h3>
                <p className="text-sm text-muted-foreground">
                  Natural Bengali translation in সহজ বাংলা
                </p>
              </div>
              
              <div className="text-center p-6 bg-card rounded-lg border shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💡</span>
                </div>
                <h3 className="font-semibold mb-2 text-card-foreground">Understand</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed summaries and meaning in Bengali
                </p>
              </div>
            </div>
          </div>
        )}

        {isProcessing && <ProcessingStatus />}
        
        {!isProcessing && results && (
          <Results 
            results={results} 
            onNewUpload={handleNewUpload}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-background/50">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Upload audio, video, or PDF files • All formats supported • No login required</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
