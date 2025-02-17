import React, { useState, useEffect } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

const ManageProfile = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [benchPR, setBenchPR] = useState('???');
  const [deadliftPR, setDeadliftPR] = useState('???');
  const [squatPR, setSquatPR] = useState('???');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const profileRef = doc(db, 'profiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');

        }
      }
    };
    fetchProfile();
  }, []);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        const profileRef = doc(db, 'profiles', user.uid);
        await setDoc(profileRef, {
          firstName,
          lastName,
          benchPR,
          deadliftPR,
          squatPR,
          updatedAt: Timestamp.now()
        }, { merge: true });

        setSuccessMessage('Profile updated successfully!');
        setErrorMessage('');
      } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
        setSuccessMessage('');
      }
    }
  };

  return (
    <>
      <div className="profile-container">
        <Card className="profile-card">
          <Card.Body>
            <Card.Title>Welcome, {firstName || 'User'}!</Card.Title>
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            
            <Form onSubmit={handleProfileSave}>
              <Form.Group controlId="formFirstName">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your first name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Form.Group>

              <Form.Group controlId="formLastName">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter your last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Form.Group>

              <Button variant="primary" type="submit"
              style = {{marginLeft : "auto", marginRight: "auto", marginTop: "20px" }}>
                Save Profile
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </div>

      <style jsx>{`
        .profile-container {
          display: flex;
          justify-content: center;
          padding: 20px;
        }

        .profile-card {
          width: 100%;
          max-width: 500px;
          margin-top: 20px;
          margin-bottom: 20px;
        }


      `}</style>
    </>
  );
};

export default ManageProfile;
