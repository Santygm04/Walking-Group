import React, { useState } from "react";
import "./CitaFormulario.css";

const CitaFormulario = () => {
  const [nombre, setNombre] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const texto = `Hola! Soy ${nombre}. Quisiera coordinar una cita. ${mensaje}`;
    const url = `https://wa.me/543813691006?text=${encodeURIComponent(texto)}`;
    window.open(url, "_blank");
  };

  return (
    <section className="cita" id="cita">
      <h2>Agendá tu Cita</h2>
      <form onSubmit={handleSubmit} className="cita-form">
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <textarea
          placeholder="Mensaje (opcional)"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
        />
        <button type="submit">Enviar por WhatsApp</button>
      </form>
    </section>
  );
};

export default CitaFormulario;
