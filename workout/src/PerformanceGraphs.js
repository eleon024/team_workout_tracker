import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Row, Col, Accordion, Card } from 'react-bootstrap';
import { Line, Pie, Bar } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import { Chart } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

const PerformanceGraphsPage = () => {
  const [workouts, setWorkouts] = useState([]);
  const [exerciseNames, setExerciseNames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (auth.currentUser) {
      fetchData();
    }
  }, [auth.currentUser]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        const workoutsSnap = await getDocs(query(collection(db, 'workouts'), where('uid', '==', user.uid), orderBy('timestamp', 'desc')));

        const workoutData = workoutsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkouts(workoutData);

        const exercises = new Set();
        workoutData.forEach(workout => {
          workout.exercises.forEach(exercise => {
            exercises.add(exercise.exercise);
          });
        });
        setExerciseNames(Array.from(exercises));

        setLoading(false);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const chartOptions = {
    animation: false,
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Weight (lbs)'
        }
      }
    }
  };




  const pieChartOptions = {
    plugins: {
      title: {
        display: true,
        text: 'Workout Quality Distribution'
      },
      datalabels: {
        formatter: (value, ctx) => {
          let sum = 0;
          let dataArr = ctx.chart.data.datasets[0].data;
          dataArr.map((data) => {
            sum += data;
          });
          let percentage = ((value * 100) / sum).toFixed(2) + "%";
          return `${percentage} (${value}/${sum})`;
        },
        color: "#FFF",
      }
    }
  };

  

  const getExercisePerformanceData = (exerciseName) => {
    const exerciseData = workouts.flatMap(workout => 
      workout.exercises.filter(exercise => exercise.exercise === exerciseName).map(exercise => ({
        date: new Date(workout.timestamp.seconds * 1000).toLocaleDateString(),
        weight: exercise.weight,
        reps: exercise.reps
      }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));

    return {
      labels: exerciseData.map(data => data.date),
      datasets: [{
        label: `${exerciseName} Performance`,
        data: exerciseData.map(data => data.weight),
        borderColor: 'rgba(75,192,192,1)',
        backgroundColor: 'rgba(75,192,192,0.2)',
        fill: false
      }]
    };
  };



  const getWorkoutQualityData = () => {
  const qualityCounts = workouts.reduce((acc, workout) => {
    acc[workout.quality] = (acc[workout.quality] || 0) + 1;
    return acc;
  }, {});

  // Manually map qualities to colors
  const mappedColors = {
    Great: 'rgba(60, 231, 1, 0.6)', // Green
    Normal: 'rgba(128, 128, 128, 0.6)', // Grey
    Poor: 'rgba(255, 99, 132, 0.6)' // Red
  };

  // Map each key in qualityCounts to its corresponding color
  const coloredData = Object.entries(qualityCounts).reduce((acc, [key, value]) => {
    acc[key] = { count: value, color: mappedColors[key] }; // Store both count and color
    return acc;
  }, {});

  return {
    labels: Object.keys(coloredData),
    datasets: [{
      label: 'Workout Quality Distribution',
      data: Object.values(coloredData).map(item => item.count), // Extract just the counts for the dataset
      backgroundColor: Object.values(coloredData).map(item => item.color), // Use the mapped colors for background
      borderColor: Object.values(coloredData).map(item => item.color), // Use the same colors for border
      borderWidth: 1
    }]
  };
};


  const getSupplementUsageData = () => {
    const supplements = workouts.flatMap(workout => workout.supplements);
    const supplementCounts = supplements.reduce((acc, supplement) => {
      acc[supplement] = (acc[supplement] || 0) + 1;
      return acc;
    }, {});
    return {
      labels: Object.keys(supplementCounts),
      datasets: [{
        label: 'Supplement Usage',
        data: Object.values(supplementCounts),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
        borderColor: 'rgba(255, 159, 64, 1)',
        borderWidth: 1
      }]
    };
  };

  const allKeys = [...exerciseNames.map((_, index) => String(index)), 'quality', 'supplements'];

  return (
    <div>
      <h1>Performance Graphs</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Accordion defaultActiveKey={allKeys} alwaysOpen>
          <Row xs={1} md={2} lg={3} className="g-4" style={{ marginTop: '20px' }}>
            {exerciseNames.map((exerciseName, index) => (
              <Col key={index}>
                <Accordion.Item eventKey={String(index)}>
                  <Accordion.Header>{exerciseName} Performance</Accordion.Header>
                  <Accordion.Body>
                    <Line data={getExercisePerformanceData(exerciseName)} options={chartOptions} />
                  </Accordion.Body>
                </Accordion.Item>
              </Col>
            ))}
            <Col>
              <Accordion.Item eventKey="quality">
                <Accordion.Header>Workout Quality Distribution</Accordion.Header>
                <Accordion.Body>
                  <Pie data={getWorkoutQualityData()} options={pieChartOptions} plugins={[ChartDataLabels]}  />
                </Accordion.Body>
              </Accordion.Item>
            </Col>
            <Col>
              <Accordion.Item eventKey="supplements">
                <Accordion.Header>Supplement Usage</Accordion.Header>
                <Accordion.Body>
                  <Bar data={getSupplementUsageData()} />
                </Accordion.Body>
              </Accordion.Item>
            </Col>
          </Row>
        </Accordion>
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default PerformanceGraphsPage;