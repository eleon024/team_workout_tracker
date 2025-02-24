// import React, { useState, useEffect } from 'react';
// import { Form, Button, Table, Modal, Alert } from 'react-bootstrap';
// import { db } from './firebase'; // Ensure Firestore is initialized correctly
// import {getAuth} from 'firebase/auth';
// import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, where} from 'firebase/firestore';
// import { updateDoc } from 'firebase/firestore';

// const options = { weekday: 'long', month: 'long', day: 'numeric' };
// const today = new Date();
// const day_formatted = today.toLocaleDateString("en-US", options);

// function Logging() {
//     const [error, setError] = useState("");
//     const [stored_exercises, setStoredExercises] = useState([]);
//     const [showPopup, setShowPopup] = useState(false);
//     const [input_exercise, setInputExercise] = useState({
//         name: '',
//         sets: '3',
//         reps: '',
//         weight: '',
//     });

//     const exercise_options = [
//         "Bench Press", "Squat", "Deadlift", "Overhead Press",
//         "Pull-Ups", "Barbell Rows", "Bicep Curls", "Tricep Dips",
//         "Leg Press", "Lunges", "Shoulder Press", "Chest Fly",
//         "Lat Pulldown", "Seated Row",
//     ];

//     const auth = getAuth();
//     const currentUser = auth.currentUser;
//     const userId = currentUser ? currentUser.uid : "guest";
//     let userName = "Guest";


//   // --- Persistent Memory: Query Firestore for today's exercises ---
//   useEffect(() => {

//     // Set boundaries for "today"
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date();
//     endOfDay.setHours(23, 59, 59, 999);

//     // Query the "exercises" collection for logs by this user from today.
//     const q = query(
//       collection(db, "exercises"),
//       where("userId", "==", userId),
//       where("createdAt", ">=", startOfDay),
//       where("createdAt", "<=", endOfDay),
//       where("completed","==",false),
//       orderBy("createdAt", "asc")
//     );

//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const exercises = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
//       setStoredExercises(exercises);
//     });

//     return () => unsubscribe();
//   }, [userId]);



//     const handleChange = (e) => {
//         setInputExercise({ ...input_exercise, [e.target.name]: e.target.value });
//         setError("");
//     };

//     const handleSubmit = async () => {
//         if (!exercise_options.includes(input_exercise.name)) {
//             setError("Please select a valid exercise from the list.");
//             return;
//         }

//         if (input_exercise.name && input_exercise.sets && input_exercise.reps && input_exercise.weight) {

//             if (userId !== "guest") {
//                 try {
//                   const userProfileRef = doc(db, "profiles", userId);
//                   const userProfileSnap = await getDoc(userProfileRef);
//                   if (userProfileSnap.exists()) {
//                     userName = userProfileSnap.data().firstName;
//                   }
//                 } catch (error) {
//                   console.error("Error fetching user profile: ", error);
//                 }
//               }
          
//             const newExercise = { ...input_exercise, createdAt: new Date(),userId, completed: false};
//             setStoredExercises([...stored_exercises, newExercise]);
//             setShowPopup(false);
//             setInputExercise({ name: '', sets: '', reps: '', weight: '' });

//             try {
//                 const exercisesCollection = collection(db, "exercises");
//                 await addDoc(exercisesCollection, newExercise);
//                 console.log("Exercise logged in Firestore");



//             } catch (e) {
//                 console.error("Error adding exercise to Firestore: ", e);
//             }

//         }
//     }
//     const handleCompleteWorkout = async () => {
//         // Check if there are any exercises saved
//         if (stored_exercises.length === 0) {
//           setError("No exercises to save in this workout.");
//           return;
//         }
        
//         // (Re)fetch user name if not guest.
//         if (userId !== "guest") {
//           try {
//             const userProfileRef = doc(db, "profiles", userId);
//             const userProfileSnap = await getDoc(userProfileRef);
//             if (userProfileSnap.exists()) {
//               userName = userProfileSnap.data().firstName;
//             }
//           } catch (error) {
//             console.error("Error fetching user profile: ", error);
//           }
//         }
        
//         try {
//           // Save the complete workout in the "workouts" collection.
//           // Firestore generates a unique document ID for you.
//           const workoutRef = await addDoc(collection(db, "exercises"), {
//             userId,
//             createdAt: new Date(),
//             exercises: stored_exercises
//           });
          
//           // Retrieve the unique workout ID.
//           const workoutId = workoutRef.id;
//           console.log("Complete workout logged in Firestore with ID:", workoutId);
          
//           // Now update the feed with a post that includes the workoutId.
//           await addDoc(collection(db, "feed"), {
//             text: `${userName} just completed a workout!`,
//             userId,
//             createdAt: new Date(),
//             workoutId  // Save the workoutId for reference.
//           });
//           console.log("Workout completion posted to feed");
      
//         // Inside handleCompleteWorkout after logging the complete workout:
//         for (const exercise of stored_exercises) {
//             const exerciseDocRef = doc(db, "exercises", exercise.id);
//             await updateDoc(exerciseDocRef, { completed: true });
//         }

//           // Clear the local exercises array.
//           setStoredExercises([]);
//         } catch (error) {
//           console.error("Error logging complete workout: ", error);
//         }
//       };
      

//     return (
//         <div style={{ textAlign: 'center' }}>
//             <h2 style={{ fontSize: '2em' }}>{day_formatted}</h2>
//             <button onClick={() => setShowPopup(true)}>Add Exercise</button>

//             <div style={{ marginTop: '20px' }}>
//                 {stored_exercises.length > 0 ? (
//                     <Table striped bordered hover>
//                         <thead>
//                             <tr>
//                                 <th>Exercise</th>
//                                 <th>Sets</th>
//                                 <th>Reps</th>
//                                 <th>Weight</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {stored_exercises.map((ex, index) => (
//                                 <tr key={index}>
//                                     <td>{ex.name}</td>
//                                     <td>{ex.sets}</td>
//                                     <td>{ex.reps}</td>
//                                     <td>{ex.weight} lbs</td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </Table>
//                 ) : (
//                     <p>No exercises added yet.</p>
//                 )}
//             </div>

//                   {/* Button to submit the complete workout and update the feed */}
//       {stored_exercises.length > 0 && (
//         <Button variant="success" onClick={handleCompleteWorkout} style={{ marginTop: '20px' }}>
//           Complete Workout
//         </Button>)}

//             <Modal show={showPopup} onHide={() => setShowPopup(false)} centered>
//                 <Modal.Header closeButton>
//                     <Modal.Title>Add Exercise</Modal.Title>
//                 </Modal.Header>
//                 <Modal.Body>
//                     {error && <Alert variant="danger">{error}</Alert>}
//                     <Form>
//                         <Form.Group>
//                             <Form.Label>Exercise</Form.Label>
//                             <Form.Control
//                                 list="exerciseOptions"
//                                 name="name"
//                                 value={input_exercise.name}
//                                 onChange={handleChange}
//                                 placeholder="Start typing..."
//                             />
//                             <datalist id="exerciseOptions">
//                                 {exercise_options.map((exercise, index) => (
//                                     <option key={index} value={exercise} />
//                                 ))}
//                             </datalist>
//                         </Form.Group>
//                         <Form.Group>
//                             <Form.Label>Sets</Form.Label>
//                             <Form.Control type="number" name="sets" value={input_exercise.sets} onChange={handleChange} />
//                         </Form.Group>
//                         <Form.Group>
//                             <Form.Label>Reps</Form.Label>
//                             <Form.Control type="number" name="reps" value={input_exercise.reps} onChange={handleChange} />
//                         </Form.Group>
//                         <Form.Group>
//                             <Form.Label>Weight (lbs)</Form.Label>
//                             <Form.Control type="number" name="weight" value={input_exercise.weight} onChange={handleChange} />
//                         </Form.Group>
//                     </Form>
//                 </Modal.Body>
//                 <Modal.Footer>
//                     <Button variant="secondary" onClick={() => setShowPopup(false)}>Cancel</Button>
//                     <Button variant="primary" onClick={handleSubmit}>OK</Button>
//                 </Modal.Footer>
//             </Modal>
//         </div>
//     );
// }

// export default Logging;
import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Badge } from 'react-bootstrap';
import { db, auth } from './firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const predefinedSupplements = [
  'Creatine',
  'BCAAs',
  'Protein',
  'Beta-alanine',
  'Caffeine',
  'Glutamine',
  'Pre-Workout'
];

const Logging = () => {
  const navigate = useNavigate();
  const [exercise, setExercise] = useState('');
  const [customExercise, setCustomExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState(['']);
  const [nutrition, setNutrition] = useState('');
  const [quality, setQuality] = useState('');
  const [splitDay, setSplitDay] = useState('');
  const [selectedSupplement, setSelectedSupplement] = useState(localStorage.getItem('selectedSupplement') || '');
  const [customSupplement, setCustomSupplement] = useState(JSON.parse(localStorage.getItem('customSupplement')) || []);
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('g');
  const [supplements, setSupplements] = useState(JSON.parse(localStorage.getItem('supplements')) || []);
  const [profile, setProfile] = useState({});
  const [customSupplements, setCustomSupplements] = useState(JSON.parse(localStorage.getItem('customSupplements')) || []);
  const [customExercises, setCustomExercises] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [exercises, setExercises] = useState(JSON.parse(localStorage.getItem('exercises')) || []);
  const [duration, setDuration] = useState('');
  const [distance, setDistance] = useState('');
  const [swimDistance, setSwimDistance] = useState('');
  const [swimFeel, setSwimFeel] = useState('');
  const [strokesUsed, setStrokesUsed] = useState([]);
  const [feltDizzy, setFeltDizzy] = useState(false);
  const strokeOptions = ['Freestyle', 'Backstroke', 'Breaststroke', 'Butterfly'];

  // Define available split day options based on the user's chosen split
  const splitOptions = {
    'push-pull-legs': ['Push', 'Pull', 'Legs', 'Cardio', 'Swimming'],
    'upper-lower': ['Upper', 'Lower', 'Cardio', 'Swimming'],
    'full-body': ['Full Body', 'Cardio', 'Swimming'],
    'bro-split': ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Cardio', 'Swimming'],
    'body-part': ['Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs', 'Cardio', 'Swimming'],
    'push-pull': ['Push', 'Pull', 'Cardio', 'Swimming'],
    'hybrid': ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs', 'Cardio', 'Swimming']
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
          setCustomSupplements(data.customSupplements || []);
          setCustomExercises(data.customExercises || {});
        } else {
          setProfile({ split: '' });
        }
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    localStorage.setItem('exercises', JSON.stringify(exercises));
  }, [exercises]);

  useEffect(() => {
    localStorage.setItem('selectedSupplement', selectedSupplement);
  }, [selectedSupplement]);

  useEffect(() => {
    localStorage.setItem('customSupplements', JSON.stringify(customSupplements));
  }, [customSupplements]);

  useEffect(() => {
    localStorage.setItem('customSupplement', JSON.stringify(customSupplement));
  }, [customSupplement]);

  useEffect(() => {
    localStorage.setItem('supplements', JSON.stringify(supplements));
  }, [supplements]);

  const handleAddSupplement = async () => {
    let newSupplement = '';
    if (selectedSupplement) {
      newSupplement = `${selectedSupplement} - ${dosage}${unit}`;
    } else if (customSupplement) {
      newSupplement = `${customSupplement} - ${dosage}${unit}`;
      // Save custom supplement to the user's profile
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
          customSupplements: [...customSupplements, customSupplement]
        });
        setCustomSupplements([...customSupplements, customSupplement]);
      }
    }
    
    if (newSupplement) {
      setSupplements([...supplements, newSupplement]);
      setSelectedSupplement('');
      setCustomSupplement('');
      setDosage('');
      setUnit('g');
    }
  };

  const handleRemoveSupplement = (index) => {
    const newSupplements = supplements.filter((_, i) => i !== index);
    setSupplements(newSupplements);
  };

  const handleAddExercise = () => {
    let newExercise = {};
    if (splitDay === 'Swimming') {
      newExercise = {
        exercise: 'Swimming',
        swimDistance,
        swimFeel,
        strokesUsed,
        feltDizzy,
      };
    } else if (splitDay === 'Cardio') {
      newExercise = {
        exercise: customExercise || exercise, 
        duration,
        distance,
      };
    } else {
      newExercise = {
        exercise: customExercise || exercise,
        weight,
        sets,
        reps,
      };
    }
  
    setExercises([...exercises, newExercise]);
  
    // Clear fields after adding an exercise
    setExercise('');
    setCustomExercise('');
    setWeight('');
    setSets('');
    setReps(['']);
    setDuration('');
    setDistance('');
    setSwimDistance('');
    setSwimFeel('');
    setStrokesUsed([]);
    setFeltDizzy(false);
  };
  
  const handleLogWorkout = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, 'workouts'), {
          exercises,
          nutrition,
          quality,
          split: profile.split,
          splitDay,
          supplements,
          uid: user.uid,
          timestamp: serverTimestamp()
        });
        setSuccessMessage('Workout logged successfully!');
        setErrorMessage('');
        localStorage.removeItem('exercises');
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);

        // Update custom exercises in the profile
        const newCustomExercises = exercises.reduce((acc, ex) => {
          if (!acc[splitDay]) {
            acc[splitDay] = [];
          }
          if (!acc[splitDay].includes(ex.exercise)) {
            acc[splitDay].push(ex.exercise);
          }
          return acc;
        }, { ...customExercises });

        const profileRef = doc(db, 'profiles', user.uid);
        await updateDoc(profileRef, {
          customExercises: newCustomExercises
        });
        setCustomExercises(newCustomExercises);

        // Clear form fields after logging the workout
        setExercise('');
        setCustomExercise('');
        setWeight('');
        setSets('');
        setReps(['']);
        setNutrition('');
        setQuality('');
        setSplitDay('');
        setSupplements([]);
        setExercises([]);
        setDuration('');
        setDistance('');
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
        setSuccessMessage('');
      }
    }
  };

  const allSupplements = [...predefinedSupplements, ...customSupplements];
  const filteredExercises = customExercises[splitDay] || [];

  const handleSetsChange = (e) => {
    const value = e.target.value;
    setSets(value);
    const newReps = Array.from({ length: value }, () => '');
    setReps(newReps);
  };

  const getDisplayText = (ex) => {
    if (ex.exercise === 'Swimming') {
      let text = `Swimming - ${ex.swimDistance || 0} meters`;
      if (ex.swimFeel) text += ` - ${ex.swimFeel}`;
      if (ex.feltDizzy) text += ` (Dizzy)`;
      if (ex.strokesUsed && ex.strokesUsed.length > 0) {
        text += ` | Strokes: ${ex.strokesUsed.join(', ')}`;
      }
      return text;
    } else if (ex.duration !== undefined || ex.distance !== undefined) {
      const durationText = ex.duration ? `${ex.duration} minutes` : '';
      const distanceText = ex.distance ? `${ex.distance} miles` : '';
      return `${ex.exercise} - ${durationText} ${distanceText}`;
    } else {
      return `${ex.exercise} - ${ex.weight || 0} lbs - ${ex.sets || 0} sets - ${ex.reps?.join(', ') || '0'} reps`;
    }
  };

  const handleRepsChange = (index, value) => {
    const newReps = [...reps];
    newReps[index] = value;
    setReps(newReps);
  };

  const handleStrokeChange = (stroke) => {
    if (strokesUsed.includes(stroke)) {
      setStrokesUsed(strokesUsed.filter((s) => s !== stroke));
    } else {
      setStrokesUsed([...strokesUsed, stroke]);
    }
  };
  
  const handleRemoveExercise = (index) => {
    const newExercises = exercises.filter((_, i) => i !== index);
    setExercises(newExercises);
  };

  const handleSplitDayChange = (e) => {
    const value = e.target.value;
    setSplitDay(value);
    if (value === 'Cardio' || value === 'Swimming') {
      setWeight('');
      setSets('');
      setReps(['']);
      setDuration('');
      setDistance('');
      setSwimDistance('');
      setSwimFeel('');
      setStrokesUsed([]);
      setFeltDizzy(false);
    }
  };

  return (
    <>
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      <Form onSubmit={handleLogWorkout}>
        <Form.Group controlId="formSplitDay">
          <Form.Label>Workout Split Day</Form.Label>
          <Form.Control
            as="select"
            value={splitDay}
            onChange={handleSplitDayChange}
            required
          >
            <option value="">Select Split Day</option>
            {profile.split &&
              splitOptions[profile.split]?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
          </Form.Control>
        </Form.Group>
        {splitDay !== 'Swimming' && (    
          <Form.Group controlId="formExercise">
            <Form.Label>Exercise</Form.Label>
            <Form.Control
              as="select"
              value={exercise}
              onChange={(e) => setExercise(e.target.value)}
            >
              <option value="">Select Exercise</option>
              {filteredExercises.map((exercise, index) => (
                <option key={index} value={exercise}>
                  {exercise}
                </option>
              ))}
            </Form.Control>
            <Form.Control
              type="text"
              placeholder="Or enter a new exercise"
              value={customExercise}
              onChange={(e) => setCustomExercise(e.target.value)}
            />
          </Form.Group>
        )}
        {splitDay === 'Cardio' ? (
          <>
            <Form.Group controlId="formDuration">
              <Form.Label>Duration (minutes)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formDistance">
              <Form.Label>Distance (miles)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter distance"
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
              />
            </Form.Group>
          </>
        ) : splitDay === 'Swimming' ? (
          <>
            <Form.Group controlId="formSwimDistance">
              <Form.Label>Distance (meters)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter distance in meters"
                value={swimDistance}
                onChange={(e) => setSwimDistance(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formStrokesUsed">
              <Form.Label>Strokes Used</Form.Label>
              {strokeOptions.map((stroke) => (
                <Form.Check
                  key={stroke}
                  type="checkbox"
                  label={stroke}
                  checked={strokesUsed.includes(stroke)}
                  onChange={() => handleStrokeChange(stroke)}
                />
              ))}
            </Form.Group>
            <Form.Group controlId="formSwimFeel">
              <Form.Label>How did you feel after?</Form.Label>
              <Form.Control
                as="select"
                value={swimFeel}
                onChange={(e) => setSwimFeel(e.target.value)}
              >
                <option value="">Select Feeling</option>
                <option value="Tired">Tired</option>
                <option value="Energized">Energized</option>
                <option value="Relaxed">Relaxed</option>
              </Form.Control>
            </Form.Group>
            <Form.Group controlId="formDizzy">
              <Form.Label>Did you feel dizzy?</Form.Label>
              <Form.Control
                as="select"
                value={feltDizzy ? 'yes' : 'no'}
                onChange={(e) => setFeltDizzy(e.target.value === 'yes')}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Form.Control>
            </Form.Group>
          </>
        ) : (
          <>
            <Form.Group controlId="formWeight">
              <Form.Label>Weight (lbs)</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </Form.Group>
            <Form.Group controlId="formSets">
              <Form.Label>Sets</Form.Label>
              <Form.Control
                type="number"
                placeholder="Enter sets"
                value={sets}
                onChange={handleSetsChange}
              />
            </Form.Group>
            {reps.map((rep, index) => (
              <Form.Group key={index} controlId={`formReps${index}`}>
                <Form.Label>Reps for Set {index + 1}</Form.Label>
                <Form.Control
                  type="number"
                  placeholder={`Reps for Set ${index + 1}`}
                  value={rep}
                  onChange={(e) => handleRepsChange(index, e.target.value)}
                />
              </Form.Group>
            ))}
          </>
        )}
        <Button onClick={handleAddExercise} style={{ marginTop: '20px' }}>
          Add Exercise
        </Button>
        <div>
          {exercises.map((ex, index) => {
            const displayText = getDisplayText(ex);
            return (
              <div key={index}>
                <Badge
                  pill
                  bg="info"
                  style={{ marginRight: '5px', marginTop: '10px', cursor: 'pointer' }}
                  onClick={() => handleRemoveExercise(index)}
                >
                  {displayText}
                </Badge>
              </div>
            );
          })}
        </div>
        <Form.Group controlId="formNutrition" style={{ marginTop: '20px' }}>
          <Form.Label>Nutrition</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter what you ate"
            value={nutrition}
            onChange={(e) => setNutrition(e.target.value)}
          />
        </Form.Group>
        <Form.Group controlId="formQuality">
          <Form.Label>Quality</Form.Label>
          <Form.Control
            as="select"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            required
          >
            <option value="">Select Quality</option>
            <option value="Poor">Poor</option>
            <option value="Normal">Normal</option>
            <option value="Great">Great</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formSupplements">
          <Form.Label>Supplements</Form.Label>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
            <Form.Control
              as="select"
              value={selectedSupplement}
              onChange={(e) => setSelectedSupplement(e.target.value)}
              style={{ marginRight: '10px' }}
            >
              <option value="">Select Supplement</option>
              {allSupplements.map((supplement, index) => (
                <option key={index} value={supplement}>
                  {supplement}
                </option>
              ))}
            </Form.Control>
            <Form.Control
              type="text"
              placeholder="Custom Supplement"
              value={customSupplement}
              onChange={(e) => setCustomSupplement(e.target.value)}
              style={{ marginRight: '10px' }}
            />
            <Form.Control
              type="number"
              placeholder="Dosage"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              style={{ width: '100px', marginRight: '10px' }}
            />
            <Form.Control
              as="select"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              style={{ width: '70px', marginRight: '10px' }}
            >
              <option value="g">g</option>
              <option value="mg">mg</option>
            </Form.Control>
            <Button onClick={handleAddSupplement}>Add</Button>
          </div>
        </Form.Group>
        <div>
          {supplements.map((supplement, index) => (
            <Badge
              key={index}
              pill
              bg="info"
              style={{ marginRight: '5px', marginTop: '10px', cursor: 'pointer' }}
              onClick={() => handleRemoveSupplement(index)}
            >
              {supplement}
            </Badge>
          ))}
        </div>
        <Button variant="primary" type="submit" style={{ marginTop: '20px' }}>
          Log Workout
        </Button>
      </Form>
    </>
  );
};

export default Logging;
