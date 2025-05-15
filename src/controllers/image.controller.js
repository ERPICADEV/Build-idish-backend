/* src/controllers/image.controller.js */
import supabase from '../services/supabaseClient.js';
import fs from 'fs';
import { promises as fsPromises } from 'fs';

// Define allowed buckets
const ALLOWED_BUCKETS = ['chefs', 'dishes', 'hostings'];

export const uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded.' });
  }

  // Validate bucket name
  const requestedBucket = req.body.bucket;
  if (!requestedBucket || !ALLOWED_BUCKETS.includes(requestedBucket)) {
    return res.status(400).json({ 
      error: 'Invalid or missing bucket name. Allowed buckets are: chefs, dishes, hostings' 
    });
  }

  const bucketName = requestedBucket;
  const { record_id, table } = req.body; // optional: if provided, update record in table with image_url

  const file = req.file;
  const fileName = file.filename; // multer (using uuid + timestamp) generated filename

  try {
    // Read file as buffer
    const fileBuffer = await fsPromises.readFile(file.path);

    // Upload file buffer to Supabase Storage bucket
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, fileBuffer, { contentType: file.mimetype });
    if (error) {
      await fsPromises.unlink(file.path).catch(console.error);
      return res.status(500).json({ error: 'Error uploading image to storage: ' + error.message });
    }

    // Generate a public URL (using Supabase Storage's getPublicUrl)
    const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    // (Optional) If record_id and table are provided, update the record in the database (e.g. update image_url in chefs, dishes, or hostings table)
    if (record_id && table) {
      const { error: updateError } = await supabase.from(table).update({ image_url: publicUrl }).eq('id', record_id);
      if (updateError) {
        console.error("Error updating record image_url:", updateError);
        // (Optionally, you can decide to rollback or ignore the error.)
      }
    }

    // Clean up: remove the temporary file (uploaded by multer) from disk
    await fsPromises.unlink(file.path).catch(console.error);

    // Return success response with the public image URL
    res.status(200).json({ image_url: publicUrl });
  } catch (err) {
    console.error("Unexpected error in uploadImage:", err);
    // (Optionally, remove the temporary file if an error occurs.)
    await fsPromises.unlink(file.path).catch(console.error);
    res.status(500).json({ error: "An unexpected error occurred." });
  }
}; 