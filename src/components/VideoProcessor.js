import { useState } from 'react';
import axios from 'axios';

const VideoProcessor = () => {
  const [videoFile, setVideoFile] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setVideoFile(e.target.files[0]);
    setResult('');
    setError('');
  };

  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  const processVideo = async () => {
    if (!videoFile || !apiKey) {
      setError('Please provide both a video file and an API key');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert video to base64
      const videoBase64 = await convertToBase64(videoFile);
      
      // Call the API endpoint
      const response = await axios.post('/api/process-video', {
        videoUrl: videoBase64,
        apiKey: apiKey
      });

      setResult(response.data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while processing the video');
    } finally {
      setLoading(false);
    }
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="video-processor">
      <h2>Video Processor</h2>
      <div className="form-group">
        <label htmlFor="video-upload">Upload Video:</label>
        <input
          id="video-upload"
          type="file"
          accept="video/*"
          onChange={handleFileChange}
        />
      </div>
      <div className="form-group">
        <label htmlFor="api-key">Gemini API Key:</label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter your Gemini API key"
        />
      </div>
      <button onClick={processVideo} disabled={loading}>
        {loading ? 'Processing...' : 'Process Video'}
      </button>
      {error && <div className="error">{error}</div>}
      {result && (
        <div className="result">
          <h3>Result:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default VideoProcessor;
