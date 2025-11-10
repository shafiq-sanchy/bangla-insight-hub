import { Loader2 } from "lucide-react";

export const ProcessingStatus = () => {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="bg-card border rounded-lg p-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-6" />
        <h3 className="text-xl font-semibold mb-2 text-card-foreground">Processing Your Files</h3>
        <p className="text-muted-foreground mb-6">
          Transcribing, translating, and generating summaries...
        </p>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>⚡ Extracting audio/text content</p>
          <p>📝 Generating English transcription</p>
          <p>🌐 Translating to সহজ বাংলা</p>
          <p>💡 Creating summary and meaning</p>
        </div>
      </div>
    </div>
  );
};
