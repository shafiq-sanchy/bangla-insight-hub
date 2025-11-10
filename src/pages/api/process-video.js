import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { videoUrl, apiKey } = req.body;

  if (!videoUrl || !apiKey) {
    return res.status(400).json({ message: 'Video URL and API key are required' });
  }

  try {
    // Initialize the Gemini API with your API key
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
    
    // For video processing, we need to fetch the video data
    // Note: This is a simplified approach. In a production environment,
    // you might need to handle video processing differently
    const response = await model.generateContent([
      "Analyze this video and provide insights in Bangla",
      {
        inlineData: {
          mimeType: "video/mp4",
          data: videoUrl
        }
      }
    ]);
    
    const result = response.response;
    const text = result.text();
    
    res.status(200).json({ result: text });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ message: 'Error processing video', error: error.message });
  }
}
