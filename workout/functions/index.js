// functions/index.js
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const functions = require("firebase-functions"); // For logging (optional)
const admin = require("firebase-admin");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("ffmpeg-static");
const os = require("os");
const path = require("path");
const cors = require('cors')({ origin: true });  // Allow requests from any origin
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

exports.sendNewPostNotification = onDocumentCreated("feed/{postId}", async (event) => {
    const post = event.data.data(); // New post document data
    const postId = event.params.postId;
  
    // Build the message payload for topic messaging
    const message = {
      notification: {
        title: "New Post!",
        body: `${post.userName} posted a new update on the feed.`,
      },
      data: {
        postId: postId,
      },
      topic: "workouts", // Topic name (no "/topics/" prefix needed)
    };
  
    try {
      // Send a message to devices subscribed to the provided topic.
      const response = await admin.messaging().send(message);
      console.log("Successfully sent message:", response);
    } catch (error) {
      console.error("Error sending message:", error);
    }
    
    return null;
  });
  


// This Cloud Function will handle POST requests to register tokens.
exports.registerToken = functions.https.onRequest((req, res) => {
    cors(req, res, async () => {
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }
    
      const { token } = req.body;
      if (!token) {
        return res.status(400).json({ message: 'No token provided.' });
      }
    
      try {
        // Save the token in Firestore.
        await admin.firestore().collection('fcmTokens').doc(token).set({
          token,
          registeredAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        // Subscribe this token to the "workouts" topic.
        admin.messaging().subscribeToTopic([token], "workouts")
          .then((response) => {
            console.log("Token subscribed to workouts:", response);
          })
          .catch((error) => {
            console.error("Error subscribing token to workouts:", error);
          });
    
        return res.status(200).json({ message: 'Token registered and subscribed successfully.' });
      } catch (error) {
        console.error('Error registering token:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
      }
    });
  });
  