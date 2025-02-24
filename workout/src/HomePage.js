import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import { Card, Badge, Button, Alert, Row, Col, Modal, Accordion } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaTrash } from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns'; // Import the date adapter

const HomePage = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({});
  const [lastWorkout, setLastWorkout] = useState(null);
  const [lastNextSplitWorkout, setLastNextSplitWorkout] = useState(null);
  const [nextSplitDay, setNextSplitDay] = useState('');
  const [splitDayExercises, setSplitDayExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [error, setError] = useState(null);
  const [denyModal, setDenyModal] = useState(false);

  const splitOptions = {
    'push-pull-legs': ['Push', 'Pull', 'Legs'],
    'upper-lower': ['Upper', 'Lower'],
    'full-body': ['Full Body'],
    'bro-split': ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs'],
    'body-part': ['Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
    'push-pull': ['Push', 'Pull'],
    'hybrid': ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Chest', 'Back', 'Shoulders', 'Arms', 'Chest and Triceps', 'Back and Biceps', 'Shoulders and Abs', 'Legs'],
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Fetch profile, last workout, workouts, and metrics in parallel
          const [profileSnap, lastWorkoutSnap, workoutsSnap, metricsSnap] = await Promise.all([
            getDoc(doc(db, 'profiles', user.uid)),
            getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'), limit(1))),
            getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc'))),
            getDocs(query(collection(db, 'profiles', user.uid, 'metrics'), orderBy('timestamp', 'asc')))
          ]);

          // Set profile data
          if (profileSnap.exists()) {
            setProfile(profileSnap.data());
          }

          // Set last workout data
          if (!lastWorkoutSnap.empty) {
            const workoutData = lastWorkoutSnap.docs[0].data();
            setLastWorkout(workoutData);
            setSplitDayExercises(workoutData.exercises || []);
            determineNextSplitDay(workoutData.splitDay);
          }

          // Set workouts data
          const workoutData = workoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setWorkouts(workoutData);

          // Set last next split workout data
          if (nextSplitDay) {
            const nextSplitWorkout = workoutData.find(workout => workout.splitDay === nextSplitDay);
            if (nextSplitWorkout) {
              setLastNextSplitWorkout(nextSplitWorkout);
            }
          }

          // Set metrics data
          const metricsData = metricsSnap.docs.map(doc => doc.data());
          setMetrics(metricsData);

          setLoading(false);
        }
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [profile.split, nextSplitDay]);

  const handleDelete = async () => {
    if (workoutToDelete) {
      await deleteDoc(doc(db, 'workouts', workoutToDelete));
      setWorkouts(workouts.filter(workout => workout.id !== workoutToDelete));
      setShowModal(false);
    }
  };

  const confirmDelete = (workoutId, e) => {
    e.stopPropagation();
    setWorkoutToDelete(workoutId);
    setShowModal(true);
  };

  const handleConfirmRecommendation = async () => {
    await updateProfileRecommendations(nextSplitDay, true);
    setConfirmModal(false);
  };

  const handleDenyRecommendation = async () => {
    setDenyModal(true);
  };

  const updateProfileRecommendations = async (day, isConfirmed) => {
    const user = auth.currentUser;
    if (user) {
      const profileRef = doc(db, 'profiles', user.uid);
      const profileSnap = await getDoc(profileRef);
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        const recommendations = data.recommendations || {};
        recommendations[day] = isConfirmed;
        await updateDoc(profileRef, { recommendations });
      }
    }
  };

  const handleExcludeDay = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          const currentExcluded = data.excludedDays || {};
          currentExcluded[nextSplitDay] = true;
          await updateDoc(profileRef, {
            excludedDays: currentExcluded
          });
        }
      }
      setDenyModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDontExcludeDay = () => {
    setDenyModal(false);
  };

  function getExerciseDisplay(exercise, workoutType) {
    if (workoutType === 'Swimming') {
      let text = `Swimming - ${exercise.swimDistance || 0} meters`;
      if (exercise.swimFeel) text += ` - ${exercise.swimFeel}`;
      if (exercise.feltDizzy) text += ` (Dizzy)`;
      if (exercise.strokesUsed?.length) {
        text += ` | Strokes: ${exercise.strokesUsed.join(', ')}`;
      }
      return text;
    } else if (workoutType === 'Cardio') {
      const durationText = exercise.duration ? `${exercise.duration} minutes` : '';
      const distanceText = exercise.distance ? `${exercise.distance} miles` : '';
      return `${exercise.exercise} - ${durationText} ${distanceText}`;
    } else {
      return `${exercise.exercise} - ${exercise.weight || 0} lbs - ${exercise.sets || 0} sets - ${exercise.reps?.join(', ') || '0'} reps`;
    }
  }

  const determineNextSplitDay = (lastSplitDay) => {
    if (profile.split && splitOptions[profile.split]) {
      let splitDays = [...splitOptions[profile.split]];
      if (profile.excludedDays) {
        splitDays = splitDays.filter(day => !profile.excludedDays[day]);
      }
      const currentIndex = splitDays.indexOf(lastSplitDay);
      const nextIndex = (currentIndex + 1) % splitDays.length;
      setNextSplitDay(splitDays[nextIndex]);
    }
  };

  const sortedWorkouts = () => {
    return [...workouts].sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  };

  const generateChartData = (label, dataKey) => {
    return {
      labels: metrics.map(metric => new Date(metric.timestamp.seconds * 1000).toLocaleDateString()),
      datasets: [
        {
          label,
          data: metrics.map(metric => metric[dataKey]),
          borderColor: 'rgba(75,192,192,1)',
          backgroundColor: 'rgba(75,192,192,0.2)',
        },
      ],
    };
  };

  const chartOptions = {
    animation: false,
  };

  return (
    <div>
      {/* Header greeting */}
      <h1>Welcome back, {profile.firstName || 'User'}!</h1>
      
      {/* Header prompting profile update if split days are not configured */}
      {(!profile.split || profile.split.trim() === "") && (
        <Alert variant="warning">
          It looks like you haven't configured your workout split days yet. Please update your profile.
        </Alert>
      )}

      <br />
      <h2>Today is likely to be a "{nextSplitDay}" day</h2>
      <Button onClick={() => setConfirmModal(true)} style={{ marginBottom: '20px', marginRight: '10px' }}>Confirm</Button>
      <Button onClick={handleDenyRecommendation} style={{ marginBottom: '20px' }}>Deny</Button>

      {lastWorkout && (
        <>
          {lastNextSplitWorkout && (
            <>
              <br />
              <h3>Last {nextSplitDay} Workout</h3>
              <Card>
                <Card.Body>
                  {lastNextSplitWorkout.exercises.map((exercise, index) => {
                    const displayText = getExerciseDisplay(exercise, lastNextSplitWorkout.splitDay);
                    return (
                      <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
                        {displayText}
                      </Badge>
                    );
                  })}
                </Card.Body>
              </Card>
            </>
          )}
          <br />
          <h3>Last {lastWorkout.splitDay} Workout</h3>
          <Card>
            <Card.Body>
              {splitDayExercises.map((exercise, index) => {
                const displayText = getExerciseDisplay(exercise, lastWorkout.splitDay);
                return (
                  <Badge key={index} pill bg="info" style={{ marginRight: '5px', marginTop: '10px' }}>
                    {displayText}
                  </Badge>
                );
              })}
            </Card.Body>
          </Card>
        </>
      )}
      {!lastWorkout && (
        <p>
          No workouts logged yet.{' '}
          <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button>
        </p>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <Row xs={1} md={2} className="g-4" style={{ marginTop: '20px' }}>
            <Col>
              <Accordion defaultActiveKey={['0']} alwaysOpen>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>Weight Over Time</Accordion.Header>
                  <Accordion.Body>
                    <Card>
                      <Card.Body>
                        <Line data={generateChartData('Weight', 'weight')} options={chartOptions} />
                      </Card.Body>
                    </Card>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
            <Col>
              <Accordion defaultActiveKey={['1']} alwaysOpen>
                <Accordion.Item eventKey="1">
                  <Accordion.Header>BMI Over Time</Accordion.Header>
                  <Accordion.Body>
                    <Card>
                      <Card.Body>
                        <Line data={generateChartData('BMI', 'bmi')} options={chartOptions} />
                      </Card.Body>
                    </Card>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
            <Col>
              <Accordion defaultActiveKey={['2']} alwaysOpen>
                <Accordion.Item eventKey="2">
                  <Accordion.Header>Body Fat Over Time</Accordion.Header>
                  <Accordion.Body>
                    <Card>
                      <Card.Body>
                        <Line data={generateChartData('Body Fat', 'bodyFat')} options={chartOptions} />
                      </Card.Body>
                    </Card>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
            <Col>
              <Accordion defaultActiveKey={['3']} alwaysOpen>
                <Accordion.Item eventKey="3">
                  <Accordion.Header>Muscle Mass Over Time</Accordion.Header>
                  <Accordion.Body>
                    <Card>
                      <Card.Body>
                        <Line data={generateChartData('Muscle Mass', 'musclemass')} options={chartOptions} />
                      </Card.Body>
                    </Card>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>

          <h2 style={{ marginTop: '40px' }}>Your Workouts</h2>
          {workouts.length === 0 ? (
            <Alert variant="info">
              No workouts logged yet.{' '}
              <Button onClick={() => navigate('/log-workout')}>Log a workout!</Button> Past workouts will be displayed here.
            </Alert>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
              {sortedWorkouts().map((workout, index) => (
                <Col key={index}>
                  <Card style={{ position: 'relative' }}>
                    <Card.Body onClick={() => navigate(`/workout/${workout.id}`)} style={{ cursor: 'pointer' }}>
                      <Card.Title>
                        {workout.splitDay} Workout on {new Date(workout.timestamp.seconds * 1000).toLocaleDateString()}
                      </Card.Title>
                    </Card.Body>
                    <FaTrash
                      onClick={(e) => confirmDelete(workout.id, e)}
                      style={{
                        color: 'red',
                        cursor: 'pointer',
                        position: 'absolute',
                        top: '10px',
                        right: '10px'
                      }}
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          )}

          <Modal show={showModal} onHide={() => setShowModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Delete</Modal.Title>
            </Modal.Header>
            <Modal.Body>Are you sure you want to delete this workout?</Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Confirm Recommendation Modal */}
          <Modal show={confirmModal} onHide={() => setConfirmModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Confirm Recommendation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Do you agree that today is likely to be a "{nextSplitDay}" day?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleDenyRecommendation}>
                Deny
              </Button>
              <Button variant="primary" onClick={handleConfirmRecommendation}>
                Confirm
              </Button>
            </Modal.Footer>
          </Modal>

          {/* Exclusion Prompt Modal (shown on Deny) */}
          <Modal show={denyModal} onHide={() => setDenyModal(false)}>
            <Modal.Header closeButton>
              <Modal.Title>Exclude Day?</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Do you want to remove "{nextSplitDay}" from your rotation?
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleDontExcludeDay}>
                No
              </Button>
              <Button variant="danger" onClick={handleExcludeDay}>
                Yes, exclude
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default HomePage;
