<<<<<<< HEAD
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Adoptar from "./pages/Adoptar";
import Perfil from "./pages/perfil";
=======
import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Adoptar from './pages/Adoptar'
import Login from './pages/Login'
>>>>>>> 04da38f1407fa4eae22b55631ca65e4613b79563

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/adoptar" element={<Adoptar />} />
<<<<<<< HEAD
        <Route path="/perfil" element={<Perfil />} />
=======
        <Route path="/login" element={<Login />} />
>>>>>>> 04da38f1407fa4eae22b55631ca65e4613b79563
      </Routes>
    </BrowserRouter>
  )
}

export default App