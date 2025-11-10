import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { video, api_key } = req.body;

    if (!video || !api_key) {
      return res.status(400).json({ error: 'Video file and API key are required' });
    }

    // Initialize Gemini API
    const genAI = new GoogleGenerativeAI(api_key);
    
    // Get the model - using gemini-pro-vision for video analysis
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert video buffer to base64
    const videoBuffer = Buffer.from(await video.arrayBuffer());
    const videoBase64 = videoBuffer.toString('base64');
    
    // Prepare the prompt
    const prompt = "এই ভিডিওটি বিশ্লেষণ করুন এবং বাংলায় বিস্তারিত অন্তর্দৃষ্টি প্রদান করুন। ভিডিওর মূল বিষয়বস্তু, গুরুত্বপূর্ণ পয়েন্ট, এবং সম্ভাব্য সুপারিশগুলি অন্তর্ভুক্ত করুন।";

    // Generate content
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: video.type,
          data: videoBase64
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    res.status(200).json({ result: text });
  } catch (error) {
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
