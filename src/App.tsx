import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setResult('');
    setError('');
    setProgress(0);
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(event.target.value);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
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

    // Check file size (Gemini has limits)
    if (selectedFile.size > 50 * 1024 * 1024) { // 50MB limit
      setError('Video file is too large. Please select a video smaller than 50MB.');
      return;
    }

    setProcessing(true);
    setError('');
    setResult('');
    setProgress(10);

    try {
      setProgress(30);
      // Convert video to base64
      const videoBase64 = await convertToBase64(selectedFile);
      setProgress(50);

      // Send to API
      const response = await axios.post('/api/process-video', {
        videoBase64,
        mimeType: selectedFile.type,
        apiKey
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 120000 // 2 minutes timeout
      });

      setProgress(90);
      setResult(response.data.result);
      setProgress(100);
      
    } catch (err: any) {
      console.error('Error:', err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try with a smaller video.');
      } else {
        setError('Failed to process video. Please check your API key and try again.');
      }
    } finally {
      setProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>বাংলা ইনসাইট হাব</h1>
          <p>Upload your videos to get AI-powered insights in Bangla</p>
        </header>
        
        <div className="upload-section">
          <div className="form-group">
            <label htmlFor="video-upload">Choose Video File:</label>
            <input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="file-input"
              disabled={processing}
            />
            {selectedFile && (
              <div className="file-info">
                <span>Selected: {selectedFile.name}</span>
                <span>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
              </div>
            )}
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
              disabled={processing}
            />
            <small className="api-hint">
              Get your API key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>
            </small>
          </div>

          <button
            onClick={handleProcess}
            disabled={processing || !selectedFile || !apiKey}
            className="process-button"
          >
            {processing ? 'Processing...' : 'Process Video'}
          </button>

          {processing && (
            <div className="progress-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{progress}%</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              <strong>Error:</strong> {error}
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
