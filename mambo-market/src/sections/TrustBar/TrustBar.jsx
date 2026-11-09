import "./TrustBar.css"

const CLIENTS = ["Kantar", "Ipsos", "Quala", "Sumesa", "Biess", "Vision Fund"]

export default function TrustBar() {
  return (
    <section className="trustbar" aria-label="Clientes que confían en Mambo Market">
      <div className="container trustbar__inner">
        <p className="trustbar__label">Confían en nuestras metodologías</p>
        <ul className="trustbar__list">
          {CLIENTS.map((client) => (
            <li key={client}>{client}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
