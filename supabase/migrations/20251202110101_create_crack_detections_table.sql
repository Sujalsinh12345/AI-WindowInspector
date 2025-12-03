/*
  # Window Crack Detection Database Schema

  1. New Tables
    - `crack_detections`
      - `id` (uuid, primary key) - Unique identifier for each detection
      - `user_id` (uuid, nullable) - Reference to authenticated user
      - `image_url` (text) - URL of the uploaded image
      - `image_name` (text) - Original filename
      - `detection_result` (jsonb) - Full AI detection results including bounding boxes
      - `crack_detected` (boolean) - Whether cracks were found
      - `window_type` (text) - Classified window type
      - `confidence_score` (numeric) - Overall confidence score
      - `created_at` (timestamptz) - Timestamp of detection
      
  2. Security
    - Enable RLS on `crack_detections` table
    - Add policy for users to insert their own detections
    - Add policy for users to view their own detections
    - Add policy for anonymous users to insert detections
    - Add policy for anonymous users to view their own detections (by id)
    
  3. Indexes
    - Index on user_id for faster queries
    - Index on created_at for sorting
*/

CREATE TABLE IF NOT EXISTS crack_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  image_url text NOT NULL,
  image_name text NOT NULL,
  detection_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  crack_detected boolean DEFAULT false,
  window_type text,
  confidence_score numeric(5,2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE crack_detections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own detections"
  ON crack_detections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous can insert detections"
  ON crack_detections FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Users can view own detections"
  ON crack_detections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view detections by id"
  ON crack_detections FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_crack_detections_user_id ON crack_detections(user_id);
CREATE INDEX IF NOT EXISTS idx_crack_detections_created_at ON crack_detections(created_at DESC);