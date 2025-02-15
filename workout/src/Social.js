import React, { useState } from 'react';
import { Card, Button } from 'react-bootstrap';

function WorkoutCard() {
  const [imgError, setImgError] = useState(false);

  return (
    <Card style={{ width: '18rem' }}>
      {!imgError && (
        <Card.Img
          variant="top"
          src="holder.js/100px180"
          onError={() => setImgError(true)}
        />
      )}
      <Card.Body>
        <Card.Title>Ben Norris Back Blast</Card.Title>
        <Card.Text>
          Ben Norris did lat pulldowns 1x1 with 100 pounds!
        </Card.Text>
        <Button variant="primary">Go somewhere</Button>
      </Card.Body>
    </Card>
  );
}

export default WorkoutCard;
