// convertExisting.js

const { Storage } = require('@google-cloud/storage');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const os = require('os');
const path = require('path');
const fs = require('fs');

// Set the path for FFmpeg
ffmpeg.setFfmpegPath(ffmpegPath);

// Replace with your bucket name (from your Firebase config)
const bucketName = 'teamworkouttracker-e5151.firebasestorage.app';

const storage = new Storage();

async function convertFile(fileName) {
  try {
    console.log(`Processing file: ${fileName}`);
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    // Create a temporary file path for the WebM file
    const tempWebmPath = path.join(os.tmpdir(), path.basename(fileName));
    await file.download({ destination: tempWebmPath });
    console.log(`Downloaded ${fileName} to ${tempWebmPath}`);

    // Define the output MP4 file path (in temp directory)
    const mp4FileName = fileName.replace('.webm', '.mp4');
    const tempMp4Path = path.join(os.tmpdir(), path.basename(mp4FileName));

    // Convert WebM to MP4 using FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(tempWebmPath)
        .outputOptions('-c:v libx264') // Use H.264 codec for video
        .on('end', async () => {
          console.log(`Conversion complete for ${fileName}`);
          // Upload the MP4 file back to the bucket
          await bucket.upload(tempMp4Path, {
            destination: mp4FileName,
            metadata: {
              contentType: 'video/mp4'
            }
          });
          console.log(`Uploaded ${mp4FileName} to bucket.`);
          // Optionally, delete the temporary files
          fs.unlinkSync(tempWebmPath);
          fs.unlinkSync(tempMp4Path);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Error converting ${fileName}:`, err);
          reject(err);
        })
        .save(tempMp4Path);
    });
  } catch (error) {
    console.error(`Error processing file ${fileName}:`, error);
  }
}

async function processAllWebmFiles() {
  const bucket = storage.bucket(bucketName);
  // List all files in the bucket
  const [files] = await bucket.getFiles();
  
  // Filter only the files ending with .webm
  const webmFiles = files.filter(file => file.name.endsWith('.webm'));
  console.log(`Found ${webmFiles.length} WebM files in the bucket.`);

  // Iterate over each WebM file and convert it
  for (const file of webmFiles) {
    await convertFile(file.name);
  }
}

// Run the process
processAllWebmFiles()
  .then(() => {
    console.log('All files processed successfully.');
  })
  .catch(err => {
    console.error('Error processing files:', err);
  });
