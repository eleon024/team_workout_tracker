import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Modal, Alert } from 'react-bootstrap';
import { collection, addDoc } from 'firebase/firestore';
import { db } from './firebase'; // Ensure Firestore is initialized correctly

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

    useEffect(() => {
        async function testPush() {
            try {
                if (!db) {
                    throw new Error("Firestore is not initialized properly.");
                }

                const loggingCollection = collection(db, "logging");
                const docRef = await addDoc(loggingCollection, {
                    testData: "This is a random push",
                    createdAt: new Date()
                });

                console.log("Document written with ID: ", docRef.id);
            } catch (e) {
                console.error("Error adding document: ", e);
            }
        }

        testPush();
    }, []);

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
            const newExercise = { ...input_exercise, createdAt: new Date() };
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
