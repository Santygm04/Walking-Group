import Icon from "../../components/Icon"
import { CAPABILITIES } from "../../data/siteData"
import "./Ticker.css"

export default function Ticker() {
  return (
    <section className="ticker" aria-hidden="true">
      <div className="ticker__track marquee-track" style={{ "--marquee-duration": "38s" }}>
        {[0, 1].map((copy) => (
          <div className="ticker__group marquee-group" key={copy} aria-hidden={copy === 1 ? "true" : undefined}>
            {CAPABILITIES.map((item) => (
              <span className="ticker__item" key={`${copy}-${item}`}>
                {item}
                <Icon name="spark" size={16} className="ticker__star" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
