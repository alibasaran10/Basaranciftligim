import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

import { Reveal } from "../shared/Reveal";

export function FeaturePanel({
  number,
  title,
  items,
  image,
  reverse = false,
}: {
  number: string;
  title: string;
  items: string[];
  image: string;
  reverse?: boolean;
}) {
  return (
    <Reveal>
      <article className={`feature-panel ${reverse ? "is-reverse" : ""}`}>
        <div className="feature-panel-copy">
          <span className="feature-number">{number}</span>
          <h3>{title}</h3>
          <ul className="check-list">
            {items.map((item) => (
              <li key={item}>
                <CheckCircle2 /> {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="feature-panel-visual">
          <Image
            src={image}
            alt={title}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </article>
    </Reveal>
  );
}
