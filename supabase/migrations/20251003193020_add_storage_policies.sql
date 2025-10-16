/*
  # Add Storage Policies for Documents Bucket

  1. Storage Policies
    - Allow authenticated users to upload documents (INSERT)
    - Allow authenticated users to view documents (SELECT)
    - Allow authenticated users to update documents (UPDATE)
    - Allow authenticated users to delete documents (DELETE)

  2. Security
    - All policies require authentication
    - Users can manage documents in the 'documents' bucket
*/

-- Create policy for inserting documents
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Create policy for selecting documents
CREATE POLICY "Authenticated users can view documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Create policy for updating documents
CREATE POLICY "Authenticated users can update documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents')
WITH CHECK (bucket_id = 'documents');

-- Create policy for deleting documents
CREATE POLICY "Authenticated users can delete documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');