import React, { useState } from 'react';
import axios from 'axios';

const VideoUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [api_key, setApiKey] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setResult('');
    setError('');
  };

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  const handleProcess = async () => {
    if (!selectedFile) {
      setError('Please select a video file first');
      return;
    }

    if (!api_key) {
      setError('Please enter your Gemini API key');
      return;
    }

    setProcessing(true);
    setError('');
    setResult('');

    try {
      // Create form data
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('api_key', api_key);

      // Send to our API endpoint
      const response = await axios.post('/api/process-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.result);
    } catch (err) {
      console.error('Error processing video:', err);
      setError(err.response?.data?.error || 'Failed to process video. Please check your API key and try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="video-upload-container">
      <div className="upload-section">
        <h2>Upload Video for Analysis</h2>
        
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
            value={api_key}
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

      <style jsx>{`
        .video-upload-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .upload-section {
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        h2 {
          color: #333;
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: #555;
        }

        .file-input, .api-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.3s;
        }

        .file-input:focus, .api-input:focus {
          outline: none;
          border-color: #4285f4;
        }

        .api-hint {
          display: block;
          margin-top: 0.5rem;
          color: #666;
          font-size: 0.875rem;
        }

        .api-hint a {
          color: #4285f4;
          text-decoration: none;
        }

        .process-button {
          width: 100%;
          padding: 0.875rem;
          background: #4285f4;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.3s;
        }

        .process-button:hover:not(:disabled) {
          background: #3367d6;
        }

        .process-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 1rem;
          padding: 0.75rem;
          background: #ffebee;
          color: #c62828;
          border-radius: 8px;
          border: 1px solid #ffcdd2;
        }

        .result-section {
          margin-top: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .result-section h3 {
          margin-top: 0;
          color: #333;
        }

        .result-content {
          margin-top: 1rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }
      `}</style>
    </div>
  );
};

export default VideoUpload;
