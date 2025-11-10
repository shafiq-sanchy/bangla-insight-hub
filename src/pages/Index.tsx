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
      // Prepare form data
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      
      if (apiKeys.geminiApiKey) {
        formData.append('geminiApiKey', apiKeys.geminiApiKey);
      }
      if (apiKeys.openaiApiKey) {
        formData.append('openaiApiKey', apiKeys.openaiApiKey);
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('process-files', {
        body: formData,
      });

      if (error) throw error;

      const newJobId = data.jobId;
      setJobId(newJobId);

      // Poll for results
      const pollInterval = setInterval(async () => {
        const { data: job, error: jobError } = await supabase
          .from('processing_jobs')
          .select('*')
          .eq('id', newJobId)
          .single();

        if (jobError) {
          clearInterval(pollInterval);
          toast.error('Error fetching job status');
          setIsProcessing(false);
          return;
        }

        if (job.status === 'completed') {
          clearInterval(pollInterval);
          setResults({
            transcription: job.transcription,
            translation: job.translation,
            summary: job.summary,
          });
          setIsProcessing(false);
          toast.success('Processing completed!');
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          toast.error(job.error || 'Processing failed');
          setIsProcessing(false);
        }
      }, 3000);

      // Stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isProcessing) {
          toast.error('Processing timeout');
          setIsProcessing(false);
        }
      }, 600000);

    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to start processing');
      setIsProcessing(false);
    }
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
            onNewUpload={() => setResults(null)}
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
