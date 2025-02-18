// ReelsPage.js
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from './firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { Button } from 'react-bootstrap';

// Embedded Video Recorder Component
const VideoRecorder = ({ onVideoRecorded }) => {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const chunksRef = useRef([]);
  useEffect(() => {
    // Request access to the camera and microphone once when the component mounts
    async function getCamera() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(userStream);
      } catch (error) {
        console.error('Error accessing media devices.', error);
      }
    }
    getCamera();
  
    // Cleanup stream on component unmount
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // Note: Dependency array is empty so this only runs once on mount
  }, []);
  

  const startRecording = () => {
    if (!stream) return;
  
    let options = {};
    let mimeType = '';
  
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      mimeType = 'video/webm;codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
      mimeType = 'video/webm;codecs=vp8';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/webm';
    }
  
    if (mimeType) {
      options.mimeType = mimeType;
    }
  
    const recorder = new MediaRecorder(stream, options);
    setMediaRecorder(recorder);
    recorder.start();
    setRecording(true);
    chunksRef.current = [];
  
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };
  
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType || 'video/webm' });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setRecording(false);
      onVideoRecorded(blob);
    };
  };
  

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
    }
  };

  return (
    <div>
      {/* Live Camera Preview */}
      <video
        autoPlay
        muted
        ref={(video) => {
          if (video && stream) {
            video.srcObject = stream;

          }

        }}
        style={{ width: '100%', maxHeight: '400px', borderRadius: '8px' , transform: 'scaleX(-1)'}}
      />
      <div style={{ marginTop: '0.5rem' }}>
        {!recording ? (
          <Button onClick={startRecording}>Start Recording</Button>
        ) : (
          <Button variant="danger" onClick={stopRecording}>
            Stop Recording
          </Button>
        )}
      </div>
      {videoUrl && (
        <div style={{ marginTop: '1rem' }}>
          <h5>Recorded Video Preview:</h5>
          <video src={videoUrl} controls style={{ width: '100%' }} />
        </div>
      )}
    </div>
  );
};

const ReelsPage = () => {
  const [reels, setReels] = useState([]);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);

  // Listen for realtime updates on posts with videos
  useEffect(() => {
    const q = query(collection(db, 'feed'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Only include posts that have a videoUrl field
      const videoPosts = posts.filter((post) => post.videoUrl);
      setReels(videoPosts);
    });
    return () => unsubscribe();
  }, []);

// Function to handle video upload and post creation
const handleVideoUpload = async (videoBlob) => {
    try {
      const storage = getStorage();
      // Generate a unique file name for the video
      const fileName = `${Date.now()}.webm`;
      const videoRef = ref(storage, `videos/${fileName}`);
      await uploadBytes(videoRef, videoBlob);
      const downloadUrl = await getDownloadURL(videoRef);
  
      const auth = getAuth();
      const user = auth.currentUser;
      let userName = 'Guest';
      if (user) {
        userName = user.displayName || 'User';
      }
  
      // Create a new post document in Firestore with the video URL and filePath
      await addDoc(collection(db, 'feed'), {
        videoUrl: downloadUrl,
        filePath: `videos/${fileName}`, // Store the storage path for later use by the Cloud Function
        userName,
        createdAt: new Date(),
        likes: 0,
        dislikes: 0,
        comments: []
      });
    } catch (error) {
      console.error('Error uploading video: ', error);
    }
  };
  

  return (
    <div>
      <h2 style={{ textAlign: 'center', margin: '1rem 0' }}>Reels</h2>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <Button variant="info" onClick={() => setShowVideoRecorder(!showVideoRecorder)}>
          {showVideoRecorder ? 'Hide Recorder' : 'Record a Video'}
        </Button>
      </div>

      {/* Video Recorder Section */}
      {showVideoRecorder && (
        <div style={{ margin: '0 auto', maxWidth: '600px', marginBottom: '2rem' }}>
          <VideoRecorder onVideoRecorded={handleVideoUpload} />
        </div>
      )}

      {/* Reels Display */}
      <div style={{ overflowY: 'scroll', height: 'calc(100vh - 200px)' }}>

        {reels.map((post) => (
            
          <div key={post.id} style={{ height: '100vh', position: 'relative' }}>
            <video
            src={post.mp4Url ? post.mp4Url : post.videoUrl}
            controls
            autoPlay
            loop
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div style={{ position: 'absolute', bottom: '10%', left: '5%', color: '#fff' }}>
              <h4>{post.userName}</h4>
              <p>{new Date(post.createdAt.seconds * 1000).toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
};

export default ReelsPage;
