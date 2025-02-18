// functions/index.js
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const functions = require("firebase-functions"); // For logging (optional)
const admin = require("firebase-admin");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const os = require("os");
const path = require("path");
const fs = require("fs");

admin.initializeApp();
ffmpeg.setFfmpegPath(ffmpegPath);

exports.processFile = onObjectFinalized(async (event) => {
  const object = event.data; // The uploaded file object
  const filePath = object.name; // e.g., "videos/1639572830123.webm"
  const contentType = object.contentType; // e.g., "video/webm"
  
  // Only process if the file is a WebM video
  if (!contentType || !contentType.startsWith("video/") || !filePath.endsWith(".webm")) {
    console.log("Not a WebM video. Exiting function.");
    return;
  }
  
  const bucket = admin.storage().bucket(object.bucket);
  const fileName = path.basename(filePath);
  const tempFilePath = path.join(os.tmpdir(), fileName);

  // Download the WebM file to a temporary directory
  await bucket.file(filePath).download({ destination: tempFilePath });
  console.log("Downloaded file to", tempFilePath);
  
  // Define the output MP4 file path in the temporary directory
  const mp4FileName = fileName.replace(".webm", ".mp4");
  const tempMp4Path = path.join(os.tmpdir(), mp4FileName);
  
  // Convert the WebM file to MP4 using FFmpeg
  return new Promise((resolve, reject) => {
    ffmpeg(tempFilePath)
      .outputOptions("-c:v libx264") // Convert video using H.264 codec
      .on("end", async () => {
        console.log("Transcoding succeeded.");
        const mp4FilePath = filePath.replace(".webm", ".mp4");
        // Upload the MP4 file back to Storage
        await bucket.upload(tempMp4Path, {
          destination: mp4FilePath,
          metadata: {
            contentType: "video/mp4",
          },
        });
        console.log("Uploaded MP4 to", mp4FilePath);
  
        // Update the corresponding Firestore document (assuming it stores the original filePath)
        const db = admin.firestore();
        const snapshot = await db.collection("feed")
          .where("filePath", "==", filePath)
          .get();
        if (!snapshot.empty) {
          snapshot.forEach((doc) => {
            // Construct the MP4 URL (adjust the URL if needed)
            const mp4Url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(mp4FilePath)}?alt=media`;
            doc.ref.update({ mp4Url });
            console.log(`Updated document ${doc.id} with mp4Url`);
          });
        }
  
        // Clean up temporary files
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(tempMp4Path);
        resolve();
      })
      .on("error", (err) => {
        console.error("Error during transcoding:", err);
        reject(err);
      })
      .save(tempMp4Path);
  });
});
