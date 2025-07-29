import React from 'react';
import logo from './logo.svg';
import './App.scss';
import {Sanalouhos} from "./components/Sanalouhos";

function App() {
  return (
    <div className="App">
      <div className={"wrapper"}>
        <Sanalouhos />
        <p>Lorem ipsum</p>
      </div>
    </div>
  );
}

export default App;
