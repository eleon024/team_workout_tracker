// syncVideos.js
const admin = require("firebase-admin");
const { getStorage } = require("firebase-admin/storage");
const { getFirestore } = require("firebase-admin/firestore");

// Initialize your Firebase Admin SDK
// (Ensure your service account key is set via GOOGLE_APPLICATION_CREDENTIALS env variable or similar)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: "teamworkouttracker-e5151.firebasestorage.app"
});

const db = getFirestore();
const bucket = getStorage().bucket();

async function syncVideosToFeed() {
  try {
    // List all files in the "videos/" folder
    const [files] = await bucket.getFiles({ prefix: "videos/" });
    console.log(`Found ${files.length} files in the bucket under 'videos/'`);

    // Loop over each file
    for (const file of files) {
      let filePath = file.name; // e.g., "videos/1739913992548.webm"
      if (filePath = "videos/1739913992548.mp4"){


      console.log(`Processing file: ${filePath}`);

      // Query Firestore to see if a document exists with this filePath
      const snapshot = await db.collection("feed")
        .where("filePath", "==", filePath)
        .get();

      if (snapshot.empty) {
        console.log(`No feed document found for ${filePath}. Adding a new document.`);

        // Optionally, generate a download URL for the file.
        // Note: getDownloadURL() returns a promise that gives you a URL that includes an access token.
        let downloadUrl;
        try {
          downloadUrl = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500' // far future expiration date
          });
          downloadUrl = downloadUrl[0];
        } catch (error) {
          console.error(`Error getting download URL for ${filePath}:`, error);
          continue;
        }

        // Create a new feed document with default values.
        await db.collection("feed").add({
          videoUrl: downloadUrl,    // Use the signed URL
          filePath: filePath,
          userName: "Imported",     // You might want to set a default user name
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          likes: 0,
          dislikes: 0,
          comments: []
        });
        console.log(`Added document for ${filePath}`);
      } else {
        console.log(`Document already exists for ${filePath}`);
      }
    }
}
    console.log("Sync complete.");
  } catch (error) {
    console.error("Error syncing videos:", error);
  }

}


syncVideosToFeed();
