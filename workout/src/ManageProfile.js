// import React, { useState, useEffect } from 'react';
// import { Form, Button, Alert, Card } from 'react-bootstrap';
// import { db, auth } from './firebase';
// import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

// const ManageProfile = () => {
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [benchPR, setBenchPR] = useState('???');
//   const [deadliftPR, setDeadliftPR] = useState('???');
//   const [squatPR, setSquatPR] = useState('???');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const profileRef = doc(db, 'profiles', user.uid);
//         const profileSnap = await getDoc(profileRef);
//         if (profileSnap.exists()) {
//           const data = profileSnap.data();
//           setFirstName(data.firstName || '');
//           setLastName(data.lastName || '');

//         }
//       }
//     };
//     fetchProfile();
//   }, []);

//   const handleProfileSave = async (e) => {
//     e.preventDefault();
//     const user = auth.currentUser;
//     if (user) {
//       try {
//         const profileRef = doc(db, 'profiles', user.uid);
//         await setDoc(profileRef, {
//           firstName,
//           lastName,
//           benchPR,
//           deadliftPR,
//           squatPR,
//           updatedAt: Timestamp.now()
//         }, { merge: true });

//         setSuccessMessage('Profile updated successfully!');
//         setErrorMessage('');
//       } catch (error) {
//         console.error(error);
//         setErrorMessage(error.message);
//         setSuccessMessage('');
//       }
//     }
//   };

//   return (
//     <>
//       <div className="profile-container">
//         <Card className="profile-card">
//           <Card.Body>
//             <Card.Title>Welcome, {firstName || 'User'}!</Card.Title>
//             {successMessage && <Alert variant="success">{successMessage}</Alert>}
//             {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
            
//             <Form onSubmit={handleProfileSave}>
//               <Form.Group controlId="formFirstName">
//                 <Form.Label>First Name</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter your first name"
//                   value={firstName}
//                   onChange={(e) => setFirstName(e.target.value)}
//                 />
//               </Form.Group>

//               <Form.Group controlId="formLastName">
//                 <Form.Label>Last Name</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter your last name"
//                   value={lastName}
//                   onChange={(e) => setLastName(e.target.value)}
//                 />
//               </Form.Group>

//               <Button variant="primary" type="submit"
//               style = {{marginLeft : "auto", marginRight: "auto", marginTop: "20px" }}>
//                 Save Profile
//               </Button>
//             </Form>
//           </Card.Body>
//         </Card>
//       </div>

//       <style jsx>{`
//         .profile-container {
//           display: flex;
//           justify-content: center;
//           padding: 20px;
//         }

//         .profile-card {
//           width: 100%;
//           max-width: 500px;
//           margin-top: 20px;
//           margin-bottom: 20px;
//         }


//       `}</style>
//     </>
//   );
// };

// export default ManageProfile;

// import React, { useState, useEffect, useCallback } from 'react';
// import { Form, Button, Alert, Card, Modal } from 'react-bootstrap';
// import Cropper from 'react-easy-crop';
// import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
// import { db, auth } from './firebase';
// import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
// import getCroppedImg from './getCroppedImg'; // A helper function (see below)

// const ManageProfile = () => {
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [errorMessage, setErrorMessage] = useState('');

//   // State for image cropping
//   const [uploadedImage, setUploadedImage] = useState(null); // URL for the selected image
//   const [cropModalOpen, setCropModalOpen] = useState(false);
//   const [crop, setCrop] = useState({ x: 0, y: 0 });
//   const [zoom, setZoom] = useState(1);
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
//   const [croppedImageBlob, setCroppedImageBlob] = useState(null);
//   const storage = getStorage();

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const user = auth.currentUser;
//       if (user) {
//         const profileRef = doc(db, 'profiles', user.uid);
//         const profileSnap = await getDoc(profileRef);
//         if (profileSnap.exists()) {
//           const data = profileSnap.data();
//           setFirstName(data.firstName || '');
//           setLastName(data.lastName || '');
//         }
//       }
//     };
//     fetchProfile();
//   }, []);

//   // When user selects a file
//   const handleFileChange = (e) => {
//     if (e.target.files && e.target.files[0]) {
//       // Create a URL for the selected file so we can show it in the Cropper
//       const imageUrl = URL.createObjectURL(e.target.files[0]);
//       setUploadedImage(imageUrl);
//       setCropModalOpen(true);
//     }
//   };

//   // Called when crop is complete
//   const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
//     setCroppedAreaPixels(croppedAreaPixels);
//   }, []);

//   // Handle cropping and get the cropped image blob
//   const handleCropImage = useCallback(async () => {
//     try {
//       const croppedBlob = await getCroppedImg(uploadedImage, croppedAreaPixels);
//       setCroppedImageBlob(croppedBlob);
//       setCropModalOpen(false);
//     } catch (e) {
//       console.error(e);
//     }
//   }, [uploadedImage, croppedAreaPixels]);

//   const handleProfileSave = async (e) => {
//     e.preventDefault();
//     const user = auth.currentUser;
//     if (user) {
//       try {
//         let photoUrl = '';
//         // If a cropped image exists, upload it
//         if (croppedImageBlob) {
//           const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_profile.jpg`);
//           const snapshot = await uploadBytes(storageRef, croppedImageBlob);
//           photoUrl = await getDownloadURL(snapshot.ref);
//         }
//         const profileRef = doc(db, 'profiles', user.uid);
//         await setDoc(
//           profileRef,
//           {
//             firstName,
//             lastName,
//             photoUrl, // Save the URL of the cropped profile photo
//             updatedAt: Timestamp.now(),
//           },
//           { merge: true }
//         );

//         setSuccessMessage('Profile updated successfully!');
//         setErrorMessage('');
//       } catch (error) {
//         console.error(error);
//         setErrorMessage(error.message);
//         setSuccessMessage('');
//       }
//     }
//   };

//   return (
//     <>
//       <div className="profile-container">
//         <Card className="profile-card">
//           <Card.Body>
//             <Card.Title>Welcome, {firstName || 'User'}!</Card.Title>
//             {successMessage && <Alert variant="success">{successMessage}</Alert>}
//             {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
//             <Form onSubmit={handleProfileSave}>
//               <Form.Group controlId="formFirstName">
//                 <Form.Label>First Name</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter your first name"
//                   value={firstName}
//                   onChange={(e) => setFirstName(e.target.value)}
//                 />
//               </Form.Group>

//               <Form.Group controlId="formLastName">
//                 <Form.Label>Last Name</Form.Label>
//                 <Form.Control
//                   type="text"
//                   placeholder="Enter your last name"
//                   value={lastName}
//                   onChange={(e) => setLastName(e.target.value)}
//                 />
//               </Form.Group>

//               <Form.Group controlId="formProfilePhoto" style={{ marginTop: '1rem' }}>
//                 <Form.Label>Profile Photo</Form.Label>
//                 <Form.Control type="file" accept="image/*" onChange={handleFileChange} />
//               </Form.Group>

//               <Button variant="primary" type="submit" style={{ marginTop: '20px' }}>
//                 Save Profile
//               </Button>
//             </Form>
//           </Card.Body>
//         </Card>
//       </div>

//       {/* Cropping Modal */}
//       <Modal show={cropModalOpen} onHide={() => setCropModalOpen(false)} centered size="lg">
//         <Modal.Header closeButton>
//           <Modal.Title>Crop Your Profile Photo</Modal.Title>
//         </Modal.Header>
//         <Modal.Body style={{ position: 'relative', height: '400px' }}>
//           {uploadedImage && (
//             <Cropper
//               image={uploadedImage}
//               crop={crop}
//               zoom={zoom}
//               aspect={1}
//               onCropChange={setCrop}
//               onZoomChange={setZoom}
//               onCropComplete={onCropComplete}
//             />
//           )}
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={() => setCropModalOpen(false)}>
//             Cancel
//           </Button>
//           <Button variant="primary" onClick={handleCropImage}>
//             Crop Image
//           </Button>
//         </Modal.Footer>
//       </Modal>

//       <style jsx>{`
//         .profile-container {
//           display: flex;
//           justify-content: center;
//           padding: 20px;
//         }
//         .profile-card {
//           width: 100%;
//           max-width: 500px;
//           margin-top: 20px;
//           margin-bottom: 20px;
//         }
//       `}</style>
//     </>
//   );
// };

// export default ManageProfile;

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Button, Alert, Card, Modal } from 'react-bootstrap';
import Cropper from 'react-easy-crop';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { db, auth } from './firebase';
import { doc, setDoc, getDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import getCroppedImg from './getCroppedImg'; // Helper function to get cropped image blob

const ManageProfile = () => {
  // Profile fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [split, setSplit] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [weight, setWeight] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [bmi, setBmi] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [musclemass, setMuscleMass] = useState('');
  const [customExercises, setCustomExercises] = useState({});
  const [customSupplements, setCustomSupplements] = useState([]);
  const [excludedDays, setExcludedDays] = useState({ Cardio: false, Swimming: false });
  
  // For success/error messages
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // States for image cropping / profile picture upload
  const [uploadedImage, setUploadedImage] = useState(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const storage = getStorage();

  // Fetch existing profile data
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
          setSplit(data.split || '');
          setAge(data.age || '');
          setGender(data.gender || '');
          setWeight(data.weight || '');
          if (data.height) {
            const [ft, inch] = data.height.split("' ");
            setHeightFt(ft || '');
            setHeightIn(inch?.replace('"', '') || '');
          }
          setBmi(data.bmi || '');
          setBodyFat(data.bodyFat || '');
          setMuscleMass(data.musclemass || '');
          setCustomExercises(data.customExercises || {});
          setCustomSupplements(data.customSupplements || []);
          setExcludedDays(data.excludedDays || { Cardio: false, Swimming: false });
        }
      }
    };
    fetchProfile();
  }, []);

  // When user selects a file, open cropping modal
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const imageUrl = URL.createObjectURL(e.target.files[0]);
      setUploadedImage(imageUrl);
      setCropModalOpen(true);
    }
  };

  // Called on crop complete; save cropped pixels info
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Crop the image and save blob
  const handleCropImage = useCallback(async () => {
    try {
      const croppedBlob = await getCroppedImg(uploadedImage, croppedAreaPixels);
      setCroppedImageBlob(croppedBlob);
      setCropModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  }, [uploadedImage, croppedAreaPixels]);

  // Handle saving the profile data along with the profile pic URL
  const handleProfileSave = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        let photoUrl = '';
        // If a cropped image exists, upload it to Firebase Storage
        if (croppedImageBlob) {
          const storageRef = ref(storage, `profiles/${user.uid}/${Date.now()}_profile.jpg`);
          const snapshot = await uploadBytes(storageRef, croppedImageBlob);
          photoUrl = await getDownloadURL(snapshot.ref);
        }
        const profileRef = doc(db, 'profiles', user.uid);
        await setDoc(
          profileRef,
          {
            firstName,
            lastName,
            split,
            age,
            gender,
            weight,
            height: `${heightFt}' ${heightIn}"`,
            bmi,
            bodyFat,
            musclemass,
            customExercises,
            customSupplements,
            excludedDays,
            photoUrl, // Save profile picture URL (if any)
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          },
          { merge: true }
        );

        // Optionally, save current metrics into a sub-collection
        const metricsRef = collection(profileRef, 'metrics');
        const timestamp = Timestamp.now();
        await addDoc(metricsRef, {
          weight,
          bmi,
          bodyFat,
          musclemass,
          timestamp
        });

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
        <Form.Group controlId="formSplit">
          <Form.Label>Workout Split</Form.Label>
          <Form.Control 
            as="select" 
            value={split} 
            onChange={(e) => setSplit(e.target.value)}
          >
            <option value="">Select Split</option>
            <option value="push-pull-legs">Push/Pull/Legs</option>
            <option value="upper-lower">Upper/Lower</option>
            <option value="full-body">Full Body</option>
            <option value="bro-split">Bro Split</option>
            <option value="body-part">Body Part Split</option>
            <option value="push-pull">Push/Pull</option>
            <option value="hybrid">Hybrid</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formAge">
          <Form.Label>Age</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="Enter your age" 
            value={age} 
            onChange={(e) => setAge(e.target.value)} 
          />
        </Form.Group>
        <Form.Group controlId="formGender">
          <Form.Label>Gender</Form.Label>
          <Form.Control 
            as="select" 
            value={gender} 
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Form.Control>
        </Form.Group>
        <Form.Group controlId="formWeight">
          <Form.Label>Weight (lbs)</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="Enter your weight" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
          />
        </Form.Group>
        <Form.Group controlId="formHeight">
          <Form.Label>Height</Form.Label>
          <div style={{ display: 'flex' }}>
            <Form.Control 
              type="number" 
              placeholder="ft" 
              value={heightFt} 
              onChange={(e) => setHeightFt(e.target.value)} 
              style={{ marginRight: '10px' }}
            />
            <Form.Control 
              type="number" 
              placeholder="in" 
              value={heightIn} 
              onChange={(e) => setHeightIn(e.target.value)} 
            />
          </div>
        </Form.Group>
        <Form.Group controlId="formBmi">
          <Form.Label>BMI</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="Enter your BMI" 
            value={bmi} 
            onChange={(e) => setBmi(e.target.value)} 
          />
        </Form.Group>
        <Form.Group controlId="formBodyFat">
          <Form.Label>Body Fat Percentage (%)</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="Enter your body fat percentage" 
            value={bodyFat} 
            onChange={(e) => setBodyFat(e.target.value)} 
          />
        </Form.Group>
        <Form.Group controlId="formMuscleMass">
          <Form.Label>Muscle Mass (lbs)</Form.Label>
          <Form.Control 
            type="number" 
            placeholder="Enter your muscle mass" 
            value={musclemass} 
            onChange={(e) => setMuscleMass(e.target.value)} 
          />
        </Form.Group>
        <Form.Group controlId="formExcludedDays" style={{ marginTop: '20px' }}>
          <Form.Label>Exclude Days</Form.Label>
          <div>
            <Form.Check 
              type="checkbox" 
              label="Exclude Cardio" 
              checked={excludedDays.Cardio} 
              onChange={(e) => setExcludedDays({ ...excludedDays, Cardio: e.target.checked })}
            />
            <Form.Check 
              type="checkbox" 
              label="Exclude Swimming" 
              checked={excludedDays.Swimming} 
              onChange={(e) => setExcludedDays({ ...excludedDays, Swimming: e.target.checked })}
            />
          </div>
        </Form.Group>
        <Form.Group controlId="formProfilePhoto" style={{ marginTop: '1rem' }}>
          <Form.Label>Profile Photo</Form.Label>
          <Form.Control 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </Form.Group>
        <Button variant="primary" type="submit" style={{ marginTop: '20px' }}>
          Save Profile
        </Button>
      </Form>

      {/* Image Cropping Modal */}
      <Modal show={cropModalOpen} onHide={() => setCropModalOpen(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Crop Your Profile Photo</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ position: 'relative', height: '400px' }}>
          {uploadedImage && (
            <Cropper
              image={uploadedImage}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setCropModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleCropImage}>
            Crop Image
          </Button>
        </Modal.Footer>
      </Modal>

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
