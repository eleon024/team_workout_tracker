// import React from 'react';
// import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
// import { Container, Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
// import Logging from './Logging';
// import Calendar from './Calendar';
// import Social from './Social';
// import SignIn from './SignIn';
// import SignUp from './SignUp';
// import ManageProfile from './ManageProfile';
// import PrivateRoute from './PrivateRoute';
// import { useAuth } from './useAuth';
// import { auth } from './firebase';
// import 'bootstrap/dist/css/bootstrap.min.css';
// import ReelsPage from './ReelsPage';

// function App() {
//   const { currentUser } = useAuth();

//   const handleSignOut = () => {
//     auth.signOut();
//   };

//   return (
//     <Router>
//       <div className="App">
//         <Navbar bg="dark" variant="dark" expand="lg">
//           <Navbar.Brand as={Link} to="/">Team Workout Tracker</Navbar.Brand>
//           <Navbar.Toggle aria-controls="basic-navbar-nav" />
//           <Navbar.Collapse id="basic-navbar-nav">
//             <Nav className="mr-auto">
//               <NavDropdown title="Menu" id="basic-nav-dropdown">
//                 <NavDropdown.Item as={Link} to="/logging">Logging</NavDropdown.Item>
//                 <NavDropdown.Item as={Link} to="/calendar">Calendar</NavDropdown.Item>
//                 <NavDropdown.Item as={Link} to="/social">Team Feed</NavDropdown.Item>
//                 <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
//                 <Nav.Link as={Link} to="/ReelsPage">ReelsPage</Nav.Link>
//               </NavDropdown>
//               <Nav.Link as={Link} to="/about">About</Nav.Link>
//               {!currentUser ? (
//                 <>
//                   <Nav.Link as={Link} to="/signin">Sign In</Nav.Link>
//                   <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
//                 </>
//               ) : (
//                 <>
//                   <Nav.Link as={Link} to="/logging">Logging</Nav.Link>
//                   <Nav.Link as={Link} to="/calendar">Calendar</Nav.Link>
//                   <Nav.Link as={Link} to="/social">Social</Nav.Link>
//                   <Nav.Link as={Link} to="/Profile">Profile</Nav.Link>
//                   <Nav.Link as={Link} to="/ReelsPage">ReelsPage</Nav.Link>
//                   <Button variant="outline-light" onClick={handleSignOut}>Sign Out</Button>
//                 </>
//               )}
//             </Nav>
//           </Navbar.Collapse>
//         </Navbar>
//         <Container className="mt-4">
//           <Routes>
//             <Route path="/signin" element={<SignIn />} />
//             <Route path="/signup" element={<SignUp />} />
//             <Route path="/about" element={<div>A team workout tracker by Edgar, Carter, Ben, and MDP.</div>} />
//             <Route path="/" element={<div>Welcome to My New Project!</div>} />
//             <Route element={<PrivateRoute />}>
//               <Route path="/logging" element={<Logging />} />
//               <Route path="/calendar" element={<Calendar />} />
//               <Route path="/social" element={<Social />} />
//               <Route path="/profile" element={<ManageProfile />} />
//               <Route path="/ReelsPage" element={<ReelsPage />} />
//             </Route>
//           </Routes>
//         </Container>
//       </div>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown, Button } from 'react-bootstrap';
import Logging from './Logging';
import Calendar from './Calendar';
import Social from './Social';
import SignIn from './SignIn';
import SignUp from './SignUp';
import ManageProfile from './ManageProfile';
import PrivateRoute from './PrivateRoute';
import { useAuth } from './useAuth';
import { auth } from './firebase';
import 'bootstrap/dist/css/bootstrap.min.css';
import ReelsPage from './ReelsPage';
import NotificationSetup from './NotificationSetup';  // Import our notifications setup
import DatingProfiles from './DatingProfiles'
import PerformanceGraphsPage from './PerformanceGraphs';

function App() {
  const { currentUser } = useAuth();

  const handleSignOut = () => {
    auth.signOut();
  };

  return (
    <Router>
      <div className="App">
        <Navbar bg="dark" variant="dark" expand="lg">
          <Navbar.Brand as={Link} to="/">Team Workout Tracker</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="mr-auto">
              <NavDropdown title="Menu" id="basic-nav-dropdown">
                <NavDropdown.Item as={Link} to="/logging">Logging</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/calendar">Calendar</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/social">Team Feed</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/profile">Profile</NavDropdown.Item>
                <Nav.Link as={Link} to="/ReelsPage">ReelsPage</Nav.Link>
              </NavDropdown>
              <Nav.Link as={Link} to="/about">About</Nav.Link>
              {!currentUser ? (
                <>
                  <Nav.Link as={Link} to="/signin">Sign In</Nav.Link>
                  <Nav.Link as={Link} to="/signup">Sign Up</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link as={Link} to="/logging">Log Exercise </Nav.Link>
                  <Nav.Link as={Link} to="/calendar">Calendar </Nav.Link>
                  <Nav.Link as={Link} to="/social">Team Feed </Nav.Link>
                  <Nav.Link as={Link} to="/profile">Profile </Nav.Link>
                  <Nav.Link as={Link} to="/ReelsPage">Reels </Nav.Link>
                  <Nav.Link as={Link} to="/DatingProfiles">Swole-Mates </Nav.Link>
                  <Nav.Link as={Link} to="/performanceGraphs">Performance Graphs</Nav.Link>
                  <Button variant="outline-light" onClick={handleSignOut}>Sign Out</Button>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <Container className="mt-4">
          {/* Include NotificationSetup to request permissions and get token */}
          <NotificationSetup />
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/about" element={<div>A team workout tracker by Edgar, Carter, Ben, and MDP.</div>} />
            <Route path="/" element={<div>Welcome to My New Project!</div>} />
            <Route element={<PrivateRoute />}>
              <Route path="/logging" element={<Logging />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/social" element={<Social />} />
              <Route path="/profile" element={<ManageProfile />} />
              <Route path="/ReelsPage" element={<ReelsPage />} />
              <Route path="/DatingProfiles" element={<DatingProfiles />} />
              <Route path="/performanceGraphs" element={<PerformanceGraphsPage />} />
            </Route>
          </Routes>
        </Container>
      </div>
    </Router>
  );
}

export default App;
