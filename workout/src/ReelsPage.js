import React, { useState, useEffect, useRef } from 'react';
import { getProfilePhotoUrl } from './getProfilePhotoUrl';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  increment,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { Button } from 'react-bootstrap';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa';

// AutoPlayVideo component
const AutoPlayVideo = ({ src, style, ...props }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.75) {
            videoRef.current && videoRef.current.play();
          } else {
            videoRef.current && videoRef.current.pause();
          }
        });
      },
      {
        threshold: 0.75 // Adjust this value as needed for "in focus"
      }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <video ref={videoRef} src={src} style={style} {...props} />
  );
};

// Embedded Video Recorder Component
const VideoRecorder = ({ onVideoRecorded }) => {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [stream, setStream] = useState(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    async function getCamera() {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setStream(userStream);
      } catch (error) {
        console.error('Error accessing media devices.', error);
      }
    }
    getCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);


  const startRecording = () => {
    if (!stream) return;
    
    // Create video element for live preview
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    videoElement.muted = true;
    videoElement.play();
    
    // Create a canvas to capture and mirror the video frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    videoElement.onloadedmetadata = () => {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      
      const drawFrame = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(-1, 1); // Mirror horizontally
        ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();
        requestAnimationFrame(drawFrame);
      };
      
      drawFrame();
      
      // Capture the canvas stream and add the original audio tracks
      const canvasStream = canvas.captureStream();
      stream.getAudioTracks().forEach((track) => canvasStream.addTrack(track));
      
      // Determine the best MIME type for recording
      let options = {};
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        options.mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/mp4;codecs=h264')) {
        options.mimeType = 'video/mp4;codecs=h264';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        options.mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        options.mimeType = 'video/webm';
      } else {
        console.warn('No supported MIME type found for MediaRecorder.');
      }
      
      try {
        const recorder = new MediaRecorder(canvasStream, options);
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
          const blob = new Blob(chunksRef.current, {
            type: options.mimeType || 'video/webm'
          });
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
          setRecording(false);
          onVideoRecorded(blob);
        };
      } catch (e) {
        console.error('MediaRecorder error:', e);
        // Optionally, fall back to RecordRTC here for Safari/iOS
      }
    };
  };
  
  

  const stopRecording = () => {
    if (mediaRecorder && recording) {
      mediaRecorder.stop();
    }
  };

  return (
    <div>
      {/* Live Camera Preview (mirrored) */}
      <video
        autoPlay
        muted
        ref={(video) => {
          if (video && stream) {
            video.srcObject = stream;
          }
        }}
        style={{
          width: '100%',
          maxHeight: '400px',
          borderRadius: '8px',
          transform: 'scaleX(-1)' // This line mirrors the preview
        }}
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


const getUserName = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return 'Guest';

  try {
    // Assuming each profile document is stored under profiles/<user.uid>
    const profileRef = doc(db, 'profiles', user.uid);
    const profileSnap = await getDoc(profileRef);
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return `${data.firstName} ${data.lastName}`;
    } else {
      return 'User';
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    return 'User';
  }
};


const ReelsPage = () => {
  const [reels, setReels] = useState([]);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [commentInputs, setCommentInputs] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'feed'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const videoPosts = posts.filter((post) => post.videoUrl);
      setReels(videoPosts);
    });
    return () => unsubscribe();
  }, []);

  const handleVideoUpload = async (videoBlob) => {
    try {
      const storage = getStorage();
      const fileName = `${Date.now()}.mp4`;
      const videoRef = ref(storage, `videos/${fileName}`);
      await uploadBytes(videoRef, videoBlob);
      const downloadUrl = await getDownloadURL(videoRef);
    
      // Get the user’s name from their profile
      const userName = await getUserName();
      // Retrieve the profile photo URL for the comment
      const profilePhotoUrl = await getProfilePhotoUrl();

      await addDoc(collection(db, 'feed'), {
        videoUrl: downloadUrl,
        filePath: `videos/${fileName}`,
        userName,
        profilePhotoUrl,
        createdAt: new Date(),
        likes: 0,
        dislikes: 0,
        comments: []
      });
    } catch (error) {
      console.error('Error uploading video: ', error);
    }
  };

  const handleLike = async (id) => {
    const postRef = doc(db, 'feed', id);
    try {
      await updateDoc(postRef, { likes: increment(1) });
    } catch (error) {
      console.error('Error updating like count: ', error);
    }
  };

  const handleDislike = async (id) => {
    const postRef = doc(db, 'feed', id);
    try {
      await updateDoc(postRef, { dislikes: increment(1) });
    } catch (error) {
      console.error('Error updating dislike count: ', error);
    }
  };

  const handleAddComment = async (id) => {
    const postRef = doc(db, 'feed', id);
    const text = commentInputs[id];


    if (!text || text.trim() === '') return;
    try {
    // Get the user’s name from their profile
    const userName = await getUserName();

          // Retrieve the profile photo URL for the comment
      const profilePhotoUrl = await getProfilePhotoUrl();
      await updateDoc(postRef, {
        comments: arrayUnion({
          text: text.trim(),
          userName,
          profilePhotoUrl,
          createdAt: new Date()
        })
      });
      setCommentInputs({ ...commentInputs, [id]: '' });
    } catch (error) {
      console.error('Error adding comment: ', error);
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
      {/* <div style={{ overflowY: 'scroll', scrollSnapType: 'y mandatory', height: '100vh' }}>
       */}
       <div
  style={{
    overflowY: 'scroll',
    WebkitOverflowScrolling: 'touch',
    scrollSnapType: 'y mandatory',
    height: 'calc(var(--vh, 1vh) * 100)',
  }}>
        {reels.map((post) => (
          <div
            key={post.id}
            style={{
              scrollSnapAlign: 'start',
              marginBottom: '1rem',
              padding: '1rem',
              background: '#fff'
            }}
          >
            {/* Video Container */}
            <div style={{ position: 'relative', height: '60vh' }}>
              <AutoPlayVideo
                src={post.mp4Url ? post.mp4Url : post.videoUrl}
                controls
                loop
                playsInline
                webkit-playsinline="true"
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '10%', right: '5%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button variant="outline-success" onClick={() => handleLike(post.id)}>
                  <FaThumbsUp /> {post.likes || 0}
                </Button>
                <Button variant="outline-danger" onClick={() => handleDislike(post.id)}>
                  <FaThumbsDown /> {post.dislikes || 0}
                </Button>
              </div>
              <div
  style={{
    position: 'absolute',
    bottom: '10%',
    left: '5%',
    display: 'flex',
    alignItems: 'center',
    color: '#fff'
  }}
>
  <img
    src={post.profilePhotoUrl || `${process.env.PUBLIC_URL}/default-avatar.jpg`} // fallback if photoUrl is missing
    alt="Profile"
    style={{
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      marginRight: '8px',
      objectFit: 'cover'
    }}
  />
  <div>
    <h4 style={{ margin: 0 }}>{post.userName}</h4>
    <p style={{ margin: 0 }}>
      {new Date(post.createdAt.seconds * 1000).toLocaleString()}
    </p>
  </div>
</div>

            </div>
            {/* Comment Section Below the Video */}
            <div style={{ marginTop: '0.5rem', background: '#f0f0f0', padding: '0.5rem', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'left' }}>
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <Button variant="primary" onClick={() => handleAddComment(post.id)} style={{ marginLeft: '0.5rem' }}>
                  Post
                </Button>
              </div>
              {post.comments && post.comments.length > 0 && (
                <div style={{ marginTop: '0.5rem', maxHeight: '150px', overflowY: 'auto', padding: '0.5rem', background: '#fff', borderRadius: '4px' }}>

              {post.comments.map((comment, index) => (
                <div
                  key={index}
                  style={{
                    marginBottom: '0.25rem',
                    display: 'flex',
                    alignItems: 'center' // changed from 'left' to 'center'
                  }}
                >
                  <img
                    src={comment.profilePhotoUrl || `${process.env.PUBLIC_URL}/default-avatar.jpg`}
                    alt="Profile"
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      marginRight: '8px',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <strong>{comment.userName}</strong>: <span> {comment.text}</span>
                  </div>
                </div>
              ))}

                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReelsPage;
