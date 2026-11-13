import { Component } from "react"
import Icon from "./Icon"
import { CONTACT_EMAIL } from "../data/siteData"
import "./ErrorBoundary.css"

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error("app-render-error", error, info?.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="error-fallback">
        <div className="error-fallback__card" role="alert">
          <span className="error-fallback__icon" aria-hidden="true">
            <Icon name="arrow-up-right" size={22} />
          </span>
          <p className="error-fallback__eyebrow">Mambo Market</p>
          <h1>Algo no salió como esperábamos.</h1>
          <p>
            Podés recargar la página e intentar de nuevo. Si el problema sigue, escribinos a{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
          <div className="error-fallback__actions">
            <button type="button" className="btn btn--accent" onClick={() => window.location.reload()}>
              Recargar página
              <Icon name="refresh" size={16} />
            </button>
            <a className="btn btn--ghost" href="/">
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    )
  }
}
