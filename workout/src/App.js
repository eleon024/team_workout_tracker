import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import Logging from './Logging';
import Calendar from './Calendar';
import Social from './Social';
import 'bootstrap/dist/css/bootstrap.min.css';


function App() {
  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Navbar.Brand as={Link} to="/">Team Workout Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              {/* General Dropdown Menu */}
              <NavDropdown title="Menu" id="basic-nav-dropdown">
                <NavDropdown.Item as={Link} to="/logging">
                  Logging
                </NavDropdown.Item>
                <br></br>
                <NavDropdown.Item as={Link} to="/calendar">
                  Calendar
                </NavDropdown.Item>
                <br></br>
                <NavDropdown.Item as={Link} to="/social">
                  Team Feed
                </NavDropdown.Item>
                <br></br>
              </NavDropdown>
              {/* Additional Nav Links if needed */}
              <Nav.Link as={Link} to="/about">About</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Container className="mt-4">
          <Routes>
            {/* Route to Logging.js component */}
            <Route path="/logging" element={<Logging />} />
            {/* Define additional routes here */}
            <Route path="/calendar" element={<Calendar/> }/>
            <Route path="/social" element={<Social/> }/>
            <Route path="/about" element={<div>A team workout tracker by Edgar, Carter, Ben, and MDP.</div>} />
            {/* Default route */}
            <Route path="/" element={<div>Welcome to My New Project!</div>} />
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
