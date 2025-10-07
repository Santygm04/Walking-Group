import React from "react";
import "./Header.css";

const Header = () => {
  return (
    <header className="header">
      <h1 className="logo">Mambo Market</h1>
      <nav>
        <ul className="nav-links">
          <li><a href="#quienes-somos">Quiénes Somos</a></li>
          <li><a href="#contacto">Contacto</a></li>
          <li><a href="#cita">Sacar Cita</a></li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
