-- Create storage bucket for uploaded files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', false);

-- RLS policies for uploads bucket
CREATE POLICY "Allow public uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Allow public to read their uploads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- Create table to track processing jobs
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_names TEXT[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  transcription TEXT,
  translation TEXT,
  summary TEXT,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on processing_jobs
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create and read processing jobs
CREATE POLICY "Anyone can create processing jobs"
ON public.processing_jobs
FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can read processing jobs"
ON public.processing_jobs
FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can update processing jobs"
ON public.processing_jobs
FOR UPDATE
TO public
USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_processing_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_processing_jobs_timestamp
BEFORE UPDATE ON public.processing_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_processing_jobs_updated_at();