import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ApiSettingsProps {
  onKeysChange: (keys: { geminiApiKey?: string; openaiApiKey?: string }) => void;
}

export const ApiSettings = ({ onKeysChange }: ApiSettingsProps) => {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [open, setOpen] = useState(false);

  const validateGeminiKey = (key: string): boolean => {
    // Basic validation - Gemini keys typically start with "AIza"
    return key.length > 20 && key.startsWith('AIza');
  };

  const validateOpenAIKey = (key: string): boolean => {
    // Basic validation - OpenAI keys typically start with "sk-"
    return key.length > 20 && key.startsWith('sk-');
  };

  const handleSave = () => {
    const keys: { geminiApiKey?: string; openaiApiKey?: string } = {};
    let hasValidKey = false;

    if (geminiKey) {
      if (!validateGeminiKey(geminiKey)) {
        toast.error('Invalid Gemini API key format. Keys should start with "AIza"');
        return;
      }
      keys.geminiApiKey = geminiKey;
      hasValidKey = true;
    }

    if (openaiKey) {
      if (!validateOpenAIKey(openaiKey)) {
        toast.error('Invalid OpenAI API key format. Keys should start with "sk-"');
        return;
      }
      keys.openaiApiKey = openaiKey;
      hasValidKey = true;
    }

    if (!hasValidKey && (geminiKey || openaiKey)) {
      toast.error('Please enter valid API keys');
      return;
    }

    onKeysChange(keys);
    setOpen(false);
    
    if (hasValidKey) {
      toast.success('API keys saved successfully!');
    } else {
      toast.info('Using default server keys');
    }
  };

  const handleClear = () => {
    setGeminiKey("");
    setOpenaiKey("");
    onKeysChange({});
    toast.info('API keys cleared');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          API Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>API Settings (Optional)</DialogTitle>
          <DialogDescription>
            Use your own API keys to bypass rate limits and ensure faster processing.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Gemini API Key */}
          <div className="space-y-2">
            <Label htmlFor="gemini" className="flex items-center gap-2">
              Gemini API Key
              <span className="text-xs text-red-500">*Required</span>
            </Label>
            <div className="relative">
              <Input
                id="gemini"
                type={showGemini ? "text" : "password"}
                placeholder="AIza... (Get from Google AI Studio)"
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowGemini(!showGemini)}
              >
                {showGemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                Get your free key from{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Google AI Studio
                </a>
                {" "}(Required for translation & summary)
              </p>
            </div>
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-2">
            <Label htmlFor="openai" className="flex items-center gap-2">
              OpenAI API Key
              <span className="text-xs text-muted-foreground">(Optional - for audio/video)</span>
            </Label>
            <div className="relative">
              <Input
                id="openai"
                type={showOpenAI ? "text" : "password"}
                placeholder="sk-... (Get from OpenAI Platform)"
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowOpenAI(!showOpenAI)}
              >
                {showOpenAI ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <p>
                Get your key from{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  OpenAI Platform
                </a>
                {" "}(Only needed for audio/video transcription)
              </p>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <div className="flex items-start gap-2">
              <Check className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200">
                <p className="font-medium mb-1">Why provide API keys?</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>No rate limits on your usage</li>
                  <li>Faster processing times</li>
                  <li>Your data stays private</li>
                  <li>Full control over costs</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Keys</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
