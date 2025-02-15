import React, { useState } from 'react';

function Logging() {
    //formatting date to be day of the week, day, month.
    var options = { weekday: 'long', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString("en-US", options);


    //list of exercises that I have stored so far, going into my table
    const [stored_exercises, stored_Exercises] = useState([]);
    //show the popup if they click the "add exercise" button
    const [showPopup, setShowPopup] = useState(false);
    //stores the exercise from the input window
    const [input_exercise, input_Exercise] = useState({
        name: '',
        sets: '',
        reps: '',
        weight: ''
    });

    //defining the input from the pop up window
    const handleChange = (e) => {
        input_Exercise({ ...input_exercise, [e.target.name]: e.target.value });
    };

    //now adding this input into my stored exercise list
    const handleSubmit = () => {
        //if all information filled in is valid -- might need larger function to check this
        if (input_exercise.name && input_exercise.sets && input_exercise.reps && input_exercise.weight) {
            // Add the infromation from the most recently added exercise to my stored list
            stored_Exercises([...stored_exercises, input_exercise]);
            //remove popup
            setShowPopup(false);
            //reset the current input
            input_Exercise({ name: '', sets: '', reps: '', weight: '' });
        }
    };

    return (
        <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2em' }}>{today}</h2>
            <button onClick={() => setShowPopup(true)}>Add Exercise</button>

            {/* Display the list of exercises in a table */}
            <div style={{ marginTop: '20px' }}>
                {stored_exercises.length > 0 ? (
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
                )}
            </div>

            {showPopup && (
                <div style={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    background: 'white', padding: '20px', boxShadow: '0px 0px 10px rgba(0,0,0,0.2)'
                }}>
                    <h3>Add Exercise</h3>
                    <input type="text" name="name" placeholder="Exercise Name" value={input_exercise.name} onChange={handleChange} /><br />
                    <input type="number" name="sets" placeholder="Sets" value={input_exercise.sets} onChange={handleChange} /><br />
                    <input type="number" name="reps" placeholder="Reps" value={input_exercise.reps} onChange={handleChange} /><br />
                    <input type="number" name="weight" placeholder="Weight (lbs)" value={input_exercise.weight} onChange={handleChange} /><br />
                    <button onClick={handleSubmit}>OK</button>
                    <button onClick={() => setShowPopup(false)}>Cancel</button>
                </div>
            )}
        </div>
    );
}

export default Logging;
