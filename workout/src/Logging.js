import React, { useState } from 'react';

function Logging() {
    //grabbing the date, formatting it in day of the week, day, month
    var options = { weekday: 'long', month: 'long', day: 'numeric' };
    const today = new Date().toLocaleDateString("en-US", options);
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
    //updating the inputted exercise with the typed in data
    const handleChange = (e) => {
        input_Exercise({ ...input_exercise, [e.target.name]: e.target.value });
    };
    //updating my stored exercises if the inputted exercise is valid
    const handleSubmit = () => {
        //might need to update conditionals for what a valid exercise
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
