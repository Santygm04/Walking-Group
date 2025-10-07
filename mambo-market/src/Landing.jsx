import React from "react";
import Header from "./components/Header/Header";
import QuienesSomos from "./components/QuienesSomos/QuienesSomos";
import GaleriaDestacados from "./components/GaleriaDestacados";
import CitaFormulario from "./components/CitaFormulario/CitaFormulario";
import "./Landing.css";

const Landing = () => {
  return (
    <div>
      <Header />

      <main>
        <QuienesSomos />
        <GaleriaDestacados />
        <CitaFormulario />
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Mambo Market — Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default Landing;
