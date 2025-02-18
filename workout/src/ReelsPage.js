import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  increment,
  arrayUnion
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
          borderRadius: '8px'
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
      const fileName = `${Date.now()}.webm`;
      const videoRef = ref(storage, `videos/${fileName}`);
      await uploadBytes(videoRef, videoBlob);
      const downloadUrl = await getDownloadURL(videoRef);

      const auth = getAuth();
      const user = auth.currentUser;
      let userName = 'Guest';
      if (user) {
        userName = user.firstName || 'User';
      }

      await addDoc(collection(db, 'feed'), {
        videoUrl: downloadUrl,
        filePath: `videos/${fileName}`,
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
      const auth = getAuth();
      const user = auth.currentUser;
      let userName = 'Guest';
      if (user) {
        userName = user.firstName || 'User';
      }
      await updateDoc(postRef, {
        comments: arrayUnion({
          text: text.trim(),
          userName,
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
      <div style={{ overflowY: 'scroll', scrollSnapType: 'y mandatory', height: '100vh' }}>
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
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '10%', right: '5%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Button variant="outline-success" onClick={() => handleLike(post.id)}>
                  <FaThumbsUp /> {post.likes || 0}
                </Button>
                <Button variant="outline-danger" onClick={() => handleDislike(post.id)}>
                  <FaThumbsDown /> {post.dislikes || 0}
                </Button>
              </div>
              <div style={{ position: 'absolute', bottom: '10%', left: '5%', color: '#fff' }}>
                <h4>{post.userName}</h4>
                <p>{new Date(post.createdAt.seconds * 1000).toLocaleString()}</p>
              </div>
            </div>
            {/* Comment Section Below the Video */}
            <div style={{ marginTop: '0.5rem', background: '#f0f0f0', padding: '0.5rem', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
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
                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                      <strong>{comment.userName}: </strong>{comment.text}
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
