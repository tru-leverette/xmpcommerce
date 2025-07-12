import JoinGameWidget from "../JoinGameWidget";
import ScavangerWidget from "../ScavangerWidget";

const widgets = [
  <JoinGameWidget key="join" />,
  <ScavangerWidget key="scavenger" />,
  // Add more widgets here
];

export default function Dashboard() {
  const isSingle = widgets.length === 1;

  return (
    <div
      className={
        isSingle
          ? "flex justify-center items-center min-h-[300px] w-full"
          : "flex flex-wrap gap-8 justify-center items-stretch w-full"
      }
    >
      {widgets.map((widget, idx) => (
        <div
          key={idx}
          className={
            isSingle
              ? "w-full max-w-xl"
              : "w-full sm:w-[350px] max-w-full flex-1 h-full"
          }
        >
          {widget}
        </div>
      ))}
    </div>
  );
}