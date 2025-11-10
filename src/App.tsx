import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] || null);
    setResult('');
    setError('');
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please select a video file first');
      return;
    }

    if (!apiKey) {
      setError('Please enter your Gemini API key');
      return;
    }

    setProcessing(true);
    setError('');
    setResult('');

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('api_key', apiKey);

      // Note: This would need a backend API endpoint to work
      // For now, we'll simulate the processing
      setError('Note: This demo requires a backend API endpoint to actually process videos with Gemini API');
      
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process video');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Bangla Insight Hub</h1>
        <p>Upload your videos to get AI-powered insights in Bangla</p>
        
        <div className="upload-section">
          <div className="form-group">
            <label htmlFor="video-upload">Choose Video File:</label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="api-key-input">Gemini API Key:</label>
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="Enter your Gemini API key"
              className="api-input"
            />
            <small className="api-hint">
              Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </small>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing || !selectedFile}
            className="process-button"
          >
            {processing ? 'Processing...' : 'Process Video'}
          </button>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {result && (
            <div className="result-section">
              <h3>Analysis Result:</h3>
              <div className="result-content">
                {result}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
