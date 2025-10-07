import React from "react";
import "./QuienesSomos.css";
import imagenMambo from "../../assets/mambo.png";

const QuienesSomos = () => {
  return (
    <section className="quienes-somos" id="quienes-somos">
      <div className="quienes-container">
        <div className="quienes-texto">
          <h2>¿Quiénes Somos?</h2>
          <p>
            En <strong>Mambo Market</strong> somos más que una tienda: somos un espacio donde el estilo y la actitud se encuentran. 
            Nacimos con la idea de ofrecer indumentaria unisex que combine diseño, calidad y personalidad.
          </p>
          <p>
            Nuestro objetivo es que cada persona que entre a Mambo Market se lleve algo más que ropa: se lleve identidad. 
            Desde las prendas urbanas hasta los básicos de todos los días, todo está pensado para que te sientas auténtico.
          </p>
          <p>
            ¡Gracias por elegirnos y ser parte de esta comunidad con estilo propio!
          </p>
        </div>
        <div className="quienes-imagen">
          <img src={imagenMambo} alt="Interior de Mambo Market" />
        </div>
      </div>
    </section>
  );
};

export default QuienesSomos;
