import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { ProcessingStatus } from "@/components/ProcessingStatus";
import { Results } from "@/components/Results";
import { FileText } from "lucide-react";

export type ProcessingResult = {
  transcription: string;
  translation: string;
  summary: string;
};

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult | null>(null);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    setResults(null);
    
    // TODO: Call backend to process files
    // For now, simulate processing
    setTimeout(() => {
      setResults({
        transcription: "Sample English transcription...",
        translation: "নমুনা বাংলা অনুবাদ...",
        summary: "সংক্ষিপ্ত বিবরণ এবং অর্থ..."
      });
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">TranslateBD</h1>
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
