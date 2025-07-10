import JoinGameWidget from "../JoinGameWidget";

const widgets = [
  <JoinGameWidget key="join" />,
  // Add more widgets here
];

export default function Dashboard() {
  const isSingle = widgets.length === 1;

  return (
    <div
      className={
        isSingle
          ? "flex justify-center items-center min-h-[300px] w-full"
          : "flex flex-wrap gap-8 justify-center items-start w-full"
      }
    >
      {widgets.map((widget, idx) => (
        <div
          key={idx}
          className={
            isSingle
              ? "w-full max-w-xl"
              : "w-full sm:w-[350px] max-w-full flex-1"
          }
        >
          {widget}
        </div>
      ))}
    </div>
  );
}