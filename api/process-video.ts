import { GoogleGenerativeAI } from '@google/generative-ai';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoBase64, mimeType, apiKey } = req.body;

    if (!videoBase64 || !mimeType || !apiKey) {
      return res.status(400).json({ error: 'Video data, MIME type, and API key are required' });
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use gemini-1.5-flash which supports video analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Prepare the prompt in Bangla
    const prompt = "এই ভিডিওটি বিশ্লেষণ করুন এবং বাংলায় বিস্তারিত অন্তর্দৃষ্টি প্রদান করুন। ভিডিওর মূল বিষয়বস্তু, গুরুত্বপূর্ণ পয়েন্ট, এবং সম্ভাব্য সুপারিশগুলি অন্তর্ভুক্ত করুন।";

    // Generate content with video
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: videoBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    res.status(200).json({ result: text });
  } catch (error: any) {
    console.error('Error processing video:', error);
    
    // Handle specific API errors
    if (error.status === 400) {
      return res.status(400).json({ error: 'Invalid API key or request format' });
    }
    
    if (error.status === 403) {
      return res.status(403).json({ error: 'API key does not have permission to access this resource' });
    }
    
    if (error.status === 429) {
      return res.status(429).json({ error: 'API rate limit exceeded. Please try again later' });
    }
    
    res.status(500).json({ error: 'Failed to process video. Please try again.' });
  }
}
