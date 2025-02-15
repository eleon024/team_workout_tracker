import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Modal, Alert } from 'react-bootstrap';
import { db } from './firebase'; // Ensure Firestore is initialized correctly
import {getAuth} from 'firebase/auth';
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, where} from 'firebase/firestore';
import { updateDoc } from 'firebase/firestore';

const options = { weekday: 'long', month: 'long', day: 'numeric' };
const today = new Date();
const day_formatted = today.toLocaleDateString("en-US", options);

function Logging() {
    const [error, setError] = useState("");
    const [stored_exercises, setStoredExercises] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [input_exercise, setInputExercise] = useState({
        name: '',
        sets: '3',
        reps: '',
        weight: '',
    });

    const exercise_options = [
        "Bench Press", "Squat", "Deadlift", "Overhead Press",
        "Pull-Ups", "Barbell Rows", "Bicep Curls", "Tricep Dips",
        "Leg Press", "Lunges", "Shoulder Press", "Chest Fly",
        "Lat Pulldown", "Seated Row",
    ];

    const auth = getAuth();
    const currentUser = auth.currentUser;
    const userId = currentUser ? currentUser.uid : "guest";
    let userName = "Guest";


  // --- Persistent Memory: Query Firestore for today's exercises ---
  useEffect(() => {

    // Set boundaries for "today"
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Query the "exercises" collection for logs by this user from today.
    const q = query(
      collection(db, "exercises"),
      where("userId", "==", userId),
      where("createdAt", ">=", startOfDay),
      where("createdAt", "<=", endOfDay),
      where("completed","==",false),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const exercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStoredExercises(exercises);
    });

    return () => unsubscribe();
  }, [userId]);



    const handleChange = (e) => {
        setInputExercise({ ...input_exercise, [e.target.name]: e.target.value });
        setError("");
    };

    const handleSubmit = async () => {
        if (!exercise_options.includes(input_exercise.name)) {
            setError("Please select a valid exercise from the list.");
            return;
        }

        if (input_exercise.name && input_exercise.sets && input_exercise.reps && input_exercise.weight) {

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
          
            const newExercise = { ...input_exercise, createdAt: new Date(),userId, completed: false};
            setStoredExercises([...stored_exercises, newExercise]);
            setShowPopup(false);
            setInputExercise({ name: '', sets: '', reps: '', weight: '' });

            try {
                const exercisesCollection = collection(db, "exercises");
                await addDoc(exercisesCollection, newExercise);
                console.log("Exercise logged in Firestore");



            } catch (e) {
                console.error("Error adding exercise to Firestore: ", e);
            }

        }
    }
    const handleCompleteWorkout = async () => {
        // Check if there are any exercises saved
        if (stored_exercises.length === 0) {
          setError("No exercises to save in this workout.");
          return;
        }
        
        // (Re)fetch user name if not guest.
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
        
        try {
          // Save the complete workout in the "workouts" collection.
          // Firestore generates a unique document ID for you.
          const workoutRef = await addDoc(collection(db, "exercises"), {
            userId,
            createdAt: new Date(),
            exercises: stored_exercises
          });
          
          // Retrieve the unique workout ID.
          const workoutId = workoutRef.id;
          console.log("Complete workout logged in Firestore with ID:", workoutId);
          
          // Now update the feed with a post that includes the workoutId.
          await addDoc(collection(db, "feed"), {
            text: `${userName} just completed a workout!`,
            userId,
            createdAt: new Date(),
            workoutId  // Save the workoutId for reference.
          });
          console.log("Workout completion posted to feed");
      
        // Inside handleCompleteWorkout after logging the complete workout:
        for (const exercise of stored_exercises) {
            const exerciseDocRef = doc(db, "exercises", exercise.id);
            await updateDoc(exerciseDocRef, { completed: true });
        }

          // Clear the local exercises array.
          setStoredExercises([]);
        } catch (error) {
          console.error("Error logging complete workout: ", error);
        }
      };
      

    return (
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2em' }}>{day_formatted}</h2>
            <button onClick={() => setShowPopup(true)}>Add Exercise</button>

            <div style={{ marginTop: '20px' }}>
                {stored_exercises.length > 0 ? (
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Exercise</th>
                                <th>Sets</th>
                                <th>Reps</th>
                                <th>Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stored_exercises.map((ex, index) => (
                                <tr key={index}>
                                    <td>{ex.name}</td>
                                    <td>{ex.sets}</td>
                                    <td>{ex.reps}</td>
                                    <td>{ex.weight} lbs</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                ) : (
                    <p>No exercises added yet.</p>
                )}
            </div>

                  {/* Button to submit the complete workout and update the feed */}
      {stored_exercises.length > 0 && (
        <Button variant="success" onClick={handleCompleteWorkout} style={{ marginTop: '20px' }}>
          Complete Workout
        </Button>)}

            <Modal show={showPopup} onHide={() => setShowPopup(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add Exercise</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Form.Group>
                            <Form.Label>Exercise</Form.Label>
                            <Form.Control
                                list="exerciseOptions"
                                name="name"
                                value={input_exercise.name}
                                onChange={handleChange}
                                placeholder="Start typing..."
                            />
                            <datalist id="exerciseOptions">
                                {exercise_options.map((exercise, index) => (
                                    <option key={index} value={exercise} />
                                ))}
                            </datalist>
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Sets</Form.Label>
                            <Form.Control type="number" name="sets" value={input_exercise.sets} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Reps</Form.Label>
                            <Form.Control type="number" name="reps" value={input_exercise.reps} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group>
                            <Form.Label>Weight (lbs)</Form.Label>
                            <Form.Control type="number" name="weight" value={input_exercise.weight} onChange={handleChange} />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPopup(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmit}>OK</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Logging;
