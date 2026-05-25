/*
  # Fix handle_new_user trigger to support first_name and last_name

  1. Changes
    - Update handle_new_user function to extract first_name and last_name from raw_user_meta_data
    - Insert these values when creating the student record
    - Maintains backward compatibility with existing behavior
  
  2. Security
    - No changes to RLS policies
    - Only affects user creation flow
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  resolved_university_id uuid;
BEGIN
  -- Get university_id from raw_user_meta_data
  resolved_university_id := (new.raw_user_meta_data->>'university_id')::uuid;
  
  -- Require university_id
  IF resolved_university_id IS NULL THEN
    RAISE EXCEPTION 'university_id is required';
  END IF;

  -- Create student record with first_name and last_name from metadata
  INSERT INTO public.students (
    id,
    university_id,
    email,
    first_name,
    last_name,
    full_name
  )
  VALUES (
    new.id,
    resolved_university_id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.raw_user_meta_data->>'full_name', ' ', 1), ''),
    COALESCE(new.raw_user_meta_data->>'last_name', split_part(new.raw_user_meta_data->>'full_name', ' ', 2), ''),
    COALESCE(new.raw_user_meta_data->>'full_name', new.email)
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;