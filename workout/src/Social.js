import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Modal } from 'react-bootstrap';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { getAuth } from 'firebase/auth';
import { FaThumbsUp, FaThumbsDown } from 'react-icons/fa'

function SocialFeed() {
  const [postText, setPostText] = useState('');
  const [feedPosts, setFeedPosts] = useState([]);
  // This state holds comment input for each post keyed by post id
  const [commentInputs, setCommentInputs] = useState({});
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState(null);

  // Listen for real-time updates in the "feed" collection
  useEffect(() => {
    const q = query(collection(db, 'feed'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setFeedPosts(posts);
    });
    return () => unsubscribe();
  }, []);

  // Handle creating a new post with default like/dislike/comment fields.
  const handleSubmit = async (e) => {
    e.preventDefault();

    const auth = getAuth();
    const user = auth.currentUser;
    const userId = user ? user.uid : "guest";
    let userName = "Guest";

    if (userId !== "guest") {
      try {
        const userProfileRef = doc(db, "profiles", userId);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          userName = userProfileSnap.data().firstName+" "+userProfileSnap.data().lastName;
        }
      } catch (error) {
        console.error("Error fetching user profile: ", error);
      }
    }

    try {
      await addDoc(collection(db, 'feed'), {
        text: postText,
        userName,
        createdAt: new Date(),
        likes: 0,
        dislikes: 0,
        comments: []
      });
      setPostText('');
    } catch (error) {
      console.error("Error adding feed post: ", error);
    }
  };

  // Function to handle likes
  const handleLike = async (postId) => {
    try {
      const postRef = doc(db, "feed", postId);
      await updateDoc(postRef, {
        likes: increment(1)
      });
    } catch (error) {
      console.error("Error updating like count: ", error);
    }
  };

  // Function to handle dislikes
  const handleDislike = async (postId) => {
    try {
      const postRef = doc(db, "feed", postId);
      await updateDoc(postRef, {
        dislikes: increment(1)
      });
    } catch (error) {
      console.error("Error updating dislike count: ", error);
    }
  };

  // Handle comment input changes per post
  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  // Function to add a comment to a specific post
  const handleAddComment = async (postId) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const userId = user ? user.uid : "guest";
    let userName = "Guest";
    if (userId !== "guest") {
      try {
        const userProfileRef = doc(db, "profiles", userId);
        const userProfileSnap = await getDoc(userProfileRef);
        if (userProfileSnap.exists()) {
          userName = userProfileSnap.data().firstName;
        }
      } catch (error) {
        console.error("Error fetching user profile: ", error);
      }
    }
    const commentText = commentInputs[postId];
    if (!commentText || commentText.trim() === "") return;
    try {
      const postRef = doc(db, "feed", postId);
      await updateDoc(postRef, {
        comments: arrayUnion({
          text: commentText,
          userName,
          createdAt: new Date()
        })
      });
      // Clear the comment input for that post
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    } catch (error) {
      console.error("Error adding comment: ", error);
    }
  };

  // View workout: fetch workout details by workoutId from the "workouts" collection
  const handleViewWorkout = async (workoutId) => {
    try {
      const workoutRef = doc(db, 'exercises', workoutId);
      const workoutSnap = await getDoc(workoutRef);
      if (workoutSnap.exists()) {
        setSelectedWorkout(workoutSnap.data());
        setShowWorkoutModal(true);
      } else {
        console.error('No workout found with that ID.');
      }
    } catch (error) {
      console.error('Error fetching workout: ', error);
    }
  };

  return (
    <div style={{ margin: '2rem' }}>
      <h2>News Feed</h2>
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="postText">
          <Form.Control
            type="text"
            placeholder="What's on your mind?"
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
          />
        </Form.Group>
        <Button variant="primary" type="submit" style={{ marginTop: '0.5rem' }}>
          Post
        </Button>
      </Form>

      <div style={{ marginTop: '2rem' }}>
        {feedPosts.map((post) => (
          <Card key={post.id} style={{ marginBottom: '1rem' }}>
            <Card.Body>
              <Card.Text>{post.text}</Card.Text>
              <div style={{ marginBottom: '0.5rem' }}>
                <Button variant="outline-success" onClick={() => handleLike(post.id)}>
                  <FaThumbsUp /> {post.likes}
                </Button>{' '}
                <Button variant="outline-danger" onClick={() => handleDislike(post.id)}>
                  <FaThumbsDown /> {post.dislikes}
                </Button>
              </div>
              <div>
                <Form.Control
                  type="text"
                  placeholder="Add a comment..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => handleCommentChange(post.id, e.target.value)}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddComment(post.id)}
                  style={{ marginTop: '0.5rem' }}
                >
                  Add Comment
                </Button>
              </div>
              {post.comments && post.comments.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h6>Comments:</h6>
                  {post.comments.map((comment, index) => (
                    <Card key={index} style={{ marginBottom: '0.5rem', padding: '0.5rem' }}>
                      <Card.Text style={{ margin: 0 }}>
                        <strong>{comment.userName}</strong>: {comment.text}
                      </Card.Text>
                      <div style={{ fontSize: '0.8rem' }}>
                        {new Date(comment.createdAt.seconds * 1000).toLocaleString()}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              <Card.Footer style={{ fontSize: '0.8rem', marginTop: '1rem' }}>
                Posted by: {post.userName} on{' '}
                {new Date(post.createdAt.seconds * 1000).toLocaleString()}
              </Card.Footer>
              {/* Only show "View Workout" button if a workoutId exists */}
              {post.workoutId && (
                <div style={{ marginTop: '1rem' }}>
                  <Button variant="info" onClick={() => handleViewWorkout(post.workoutId)}>
                    View Workout
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Modal for displaying complete workout details */}
      <Modal show={showWorkoutModal} onHide={() => setShowWorkoutModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Workout Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWorkout ? (
            <div>
              <p>
                <strong>Date:</strong>{' '}
                {new Date(selectedWorkout.createdAt.seconds * 1000).toLocaleString()}
              </p>
              <h5>Exercises:</h5>
              <ul>
                {selectedWorkout.exercises &&
                  selectedWorkout.exercises.map((ex, index) => (
                    <li key={index}>
                      {ex.name}: {ex.sets} sets, {ex.reps} reps, {ex.weight} lbs
                    </li>
                  ))}
              </ul>
            </div>
          ) : (
            <p>No workout details available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWorkoutModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default SocialFeed;