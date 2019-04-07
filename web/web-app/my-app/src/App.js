import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

//Dictionary of tinkacore ids
//Each instance added to dictionary will have
//Specific characteristics
//Want to print out and these connections
//Have a list of text
//Updated in real time if connected
//Similar to to do list in tutorials
//Print values of sensors
class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit!! <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export default App;
