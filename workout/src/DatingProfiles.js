import React, { useState } from 'react';

const profiles = [
  { id: 1, name: 'Ben Norris', age: 22, image: require('./assets/Ben.jpg') },
  { id: 2, name: 'Edgar Leon', age: 21, image: require('./assets/Edgar.jpg') },
  { id: 3, name: 'Carter Rostron', age: 19, image: require('./assets/Carter.jpg') },
  { id: 4, name: 'MDP', age: 26, image: require('./assets/Mihir.jpg') },
];

const ProfilePage = () => {
  const [profileIndex, setProfileIndex] = useState(0);
  const [matchMessage, setMatchMessage] = useState(null);

  const nextProfile = () => {
    setProfileIndex((prevIndex) => (prevIndex + 1) % profiles.length);
  };

  const handleMatch = () => {
    setMatchMessage(`You matched with ${profiles[profileIndex].name}!`);
    
    // Hide the message after 1 second and move to the next profile
    setTimeout(() => {
      setMatchMessage(null);
      nextProfile();
    }, 1000);
  };

  return (
    <div style={styles.container}>
      {/* Work in Progress Message */}
      <div style={styles.header}>
        <strong>Work in progress...</strong> Please give suggestions to Carter  
        <strong> "big muscles" </strong>Rostron in <strong>Team-Feed</strong> or <strong>Reels</strong>!
      </div>

      {/* Main Content Lowered */}
      <div style={styles.content}>
        {matchMessage && <div style={styles.matchPopup}>{matchMessage}</div>}

        <img src={profiles[profileIndex].image} alt={profiles[profileIndex].name} style={styles.image} />
        <h2>{profiles[profileIndex].name}, {profiles[profileIndex].age}</h2>

        <div style={styles.buttonContainer}>
          <button onClick={nextProfile} style={styles.passButton}>Pass</button>
          <button onClick={handleMatch} style={styles.matchButton}>Match</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#ffcc00',
    padding: '10px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '5px',
    marginBottom: '50px', // Pushes everything else down
  },
  content: {
    marginTop: '50px', // Additional spacing below the header
  },
  image: {
    width: '300px',
    height: '300px',
    borderRadius: '10px',
    objectFit: 'cover',
  },
  buttonContainer: {
    marginTop: '20px',
  },
  passButton: {
    marginRight: '10px',
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: 'gray',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  matchButton: {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: 'green',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  matchPopup: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, 40%)',
    backgroundColor: 'green',
    color: 'white',
    padding: '50px',
    borderRadius: '10px',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    zIndex: 10,
  },
};

export default ProfilePage;