import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Modal, Button } from 'react-bootstrap';
import { db } from './firebase';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  where 
} from 'firebase/firestore';

function Calendar() {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedWorkouts, setSelectedWorkouts] = useState(null);

  useEffect(() => {
    async function fetchWorkoutsAndProfiles() {
      try {
        // 1. Fetch all workouts (or exercises) for the desired range.
        const workoutsQuery = query(
          collection(db, 'exercises'),
          orderBy('createdAt', 'asc')
        );
        const workoutsSnapshot = await getDocs(workoutsQuery);
        const workouts = workoutsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // 2. Get unique userIds from the workouts.
        const userIds = [...new Set(workouts.map(workout => workout.userId))];

        // 3. Build a mapping of userId -> firstName using the document ID.
        let profilesMap = {};
        if (userIds.length > 0) {
          // Use __name__ to query by document ID.
          const profilesQuery = query(
            collection(db, 'profiles'),
            where('__name__', 'in', userIds)
          );
          const profilesSnapshot = await getDocs(profilesQuery);
          profilesSnapshot.docs.forEach(docSnap => {
            const data = docSnap.data();
            // Map the profile document ID to its firstName.
            profilesMap[docSnap.id] = data.firstName;
          });
        }

        // 4. Aggregate workouts by user (using firstName) and date.
        const aggregated = {};
        workouts.forEach(workout => {
          // Assume workout.createdAt is a Firestore Timestamp.
          const workoutDate = new Date(workout.createdAt.seconds * 1000);
          const dateKey = workoutDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
          // Use the firstName from profilesMap; fallback to the userId if not found.
          const name = profilesMap[workout.userId] || workout.userId;
          const groupKey = `${workout.userId}-${dateKey}`;
          if (!aggregated[groupKey]) {
            aggregated[groupKey] = {
              userName: name,
              date: dateKey,
              workouts: []
            };
          }
          aggregated[groupKey].workouts.push(workout);
        });

        // 5. Create calendar events for each group.
        const eventsArray = Object.values(aggregated).map(group => ({
          title: `${group.userName} worked out`,
          date: group.date,
          extendedProps: {
            workouts: group.workouts
          }
        }));

        setEvents(eventsArray);
      } catch (error) {
        console.error('Error fetching workouts or profiles:', error);
      }
    }
    fetchWorkoutsAndProfiles();
  }, []);

  const handleEventClick = (clickInfo) => {
    // When an event is clicked, display the aggregated workout details in a modal.
    setSelectedWorkouts(clickInfo.event.extendedProps.workouts);
    setShowModal(true);
  };

  return (
    <div>
      <h2>Team Calendar</h2>
      <FullCalendar
        plugins={[ dayGridPlugin ]}
        initialView="dayGridMonth"
        events={events}
        eventClick={handleEventClick}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Workout Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedWorkouts ? (
            <div>
              {selectedWorkouts.map((workout, index) => (
                <div key={index} style={{ marginBottom: '1rem' }}>
                  {/* <p>
                    <strong>Workout ID:</strong> {workout.id}
                  </p> */}
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(workout.createdAt.seconds * 1000).toLocaleString()}
                  </p>
                  {workout.exercises && (
                    <div>
                      <strong>Exercises:</strong>
                      <ul>
                        {workout.exercises.map((ex, idx) => (
                          <li key={idx}>
                            {ex.name}: {ex.sets} sets, {ex.reps} reps, {ex.weight} lbs
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No workout data available.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Calendar;
