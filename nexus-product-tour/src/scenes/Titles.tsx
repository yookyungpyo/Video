import { AnimatedText } from "../components/AnimatedText";

/** Kinetic section headline shown above the product during scenes 02–05. */
const TITLES = [
  { text: "Everything in one place.", start: 100, end: 204 },
  { text: "From prompt to progress.", start: 214, end: 326 },
  { text: "Automate the ordinary.", start: 338, end: 448 },
  { text: "Built for what’s next.", start: 456, end: 538 },
];

export const Titles: React.FC = () => (
  <>
    {TITLES.map((t) => (
      <AnimatedText
        key={t.text}
        text={t.text}
        startFrame={t.start}
        duration={22}
        stagger={3}
        size={76}
        weight={700}
        tracking={-0.04}
        exit={{ startFrame: t.end - 12, duration: 12, opacity: 0, translateY: -24, blur: 6 }}
        style={{ position: "absolute", left: 0, right: 0, top: 150 }}
      />
    ))}
  </>
);
