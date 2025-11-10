import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Settings, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApiSettingsProps {
  onKeysChange: (keys: { geminiApiKey?: string; openaiApiKey?: string }) => void;
}

export const ApiSettings = ({ onKeysChange }: ApiSettingsProps) => {
  const [geminiKey, setGeminiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    onKeysChange({
      geminiApiKey: geminiKey || undefined,
      openaiApiKey: openaiKey || undefined,
    });
    setOpen(false);
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
            Use your own API keys to bypass rate limits. Leave empty to use default server keys.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="gemini">Gemini API Key</Label>
            <div className="relative">
              <Input
                id="gemini"
                type={showGemini ? "text" : "password"}
                placeholder="Enter your Gemini API key"
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
            <p className="text-xs text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="openai">OpenAI API Key (for audio/video)</Label>
            <div className="relative">
              <Input
                id="openai"
                type={showOpenAI ? "text" : "password"}
                placeholder="Enter your OpenAI API key"
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
            <p className="text-xs text-muted-foreground">
              Get your key from{" "}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                OpenAI Platform
              </a>
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Keys</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
