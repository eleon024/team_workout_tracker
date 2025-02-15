import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Modal, Alert } from 'react-bootstrap';

function Logging() {
    //grabbing the date, formatting it in day of the week, day, month
    var options = { weekday: 'long', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString("en-US", options);

    //setting error alerts
    const [error, setError] = useState("");

    //list that stores the exercises I've done on this day
    const [stored_exercises, stored_Exercises] = useState([]);
    //boolean that elects to show popup after clicking add exercise
    const [showPopup, setShowPopup] = useState(false);
    //information from the popup of the exercise I just inputted
    const [input_exercise, input_Exercise] = useState({
        name: '',
        sets: '',
        reps: '',
        weight: '',
        today
    });

    // List of predefined exercises
    const exercise_options = [
        "Bench Press", "Squat", "Deadlift", "Overhead Press",
        "Pull-Ups", "Barbell Rows", "Bicep Curls", "Tricep Dips",
        "Leg Press", "Lunges", "Shoulder Press", "Chest Fly",
        "Lat Pulldown", "Seated Row",
    ];


    //updating the inputted exercise with the typed in data
    const handleChange = (e) => {
        input_Exercise({ ...input_exercise, [e.target.name]: e.target.value });
        setError("");
    };
    //updating my stored exercises if the inputted exercise is valid
    const handleSubmit = () => {
        //make sure is a valid exercise
        if (!exercise_options.includes(input_exercise.name)) {
            setError("Please select a valid exercise from the list.");
            return;
        }

        if (input_exercise.name && input_exercise.sets && input_exercise.reps && input_exercise.weight) {
            stored_Exercises([...stored_exercises, input_exercise]);
            setShowPopup(false);
            input_Exercise({ name: '', sets: '', reps: '', weight: '' });
        }
    };

    //Function to render the table of exercises I have done today
    const renderExerciseTable = () => {
        return stored_exercises.length > 0 ? (
            <table style={{ margin: 'auto', borderCollapse: 'collapse', width: '50%', border: '1px solid black' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f2f2f2' }}>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Exercise</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Sets</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Reps</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Weight</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Printing exercise name, set, reps, weights */}
                    {stored_exercises.map((ex, index) => (
                        <tr key={index}>
                            <td style={{ border: '1px solid black', padding: '8px' }}>{ex.name}</td>
                            <td style={{ border: '1px solid black', padding: '8px' }}>{ex.sets}</td>
                            <td style={{ border: '1px solid black', padding: '8px' }}>{ex.reps}</td>
                            <td style={{ border: '1px solid black', padding: '8px' }}>{ex.weight} lbs</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        ) : (
            <p>No exercises added yet.</p>
        );
    };

    //Function to render the popup form where user inputs exercise they just did
    const renderPopup = () => {
        return (
            <Modal show={showPopup} onHide={() => setShowPopup(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Add Exercise</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>} {/* Display error */}
                    <Form>
                        {/* Exercise Dropdown with Autofill */}
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
        );
    };

    //What gets printed!
    return (
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2em' }}>{today}</h2>
            {/* Add exercise button */}
            <button onClick={() => setShowPopup(true)}>Add Exercise</button>

            {/* Exercise Table */}
            <div style={{ marginTop: '20px' }}>{renderExerciseTable()}</div>

            {/* Popup */}
            {showPopup && renderPopup()}
        </div>
    );
}

export default Logging;
