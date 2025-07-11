export type StepProgressProps = {
  steps: string[];
  currentStep: number;
};

export function StepProgress({ steps, currentStep }: StepProgressProps) {
  // Helper to interpolate between blue and green for in-between steps
  const getStepColor = (idx: number) => {
    if (idx === 0) {
      // First step: blue
      return "bg-blue-500 border-blue-600 text-white";
    }
    if (idx === steps.length - 1) {
      // Last step: green
      return "bg-green-500 border-green-600 text-white";
    }
    // In-between steps: interpolate blue to green
    const ratio = idx / (steps.length - 1);
    if (ratio < 0.34) {
      return "bg-cyan-500 border-cyan-600 text-white";
    }
    if (ratio < 0.67) {
      return "bg-teal-400 border-teal-500 text-white";
    }
    return "bg-green-400 border-green-500 text-white";
  };

  const getConnectorColor = (idx: number) => {
    // Connector between steps: interpolate blue to green
    if (idx === 0) return "bg-blue-500";
    if (idx === steps.length - 2) return "bg-green-500";
    const ratio = (idx + 1) / (steps.length - 1);
    if (ratio < 0.34) return "bg-cyan-500";
    if (ratio < 0.67) return "bg-teal-400";
    return "bg-green-400";
  };

  return (
    <div className="flex items-center justify-center p-2 my-2 w-full max-w-xs mx-auto overflow-x-auto">
      {steps.map((step, idx) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-full border-2 text-xs font-bold shadow transition-all duration-200 ${
              idx < currentStep
                ? getStepColor(idx)
                : idx === currentStep
                ? "bg-white border-green-400 text-green-700 shadow-lg"
                : "bg-gray-200 border-gray-300 text-gray-400"
            }`}
          >
            {idx + 1}
          </div>
          {idx < steps.length - 1 && (
            <div
              className={`w-5 h-1 mx-1 rounded transition-all duration-200 ${
                idx < currentStep
                  ? getConnectorColor(idx)
                  : "bg-gray-300"
              }`}
            ></div>
          )}
        </div>
      ))}
    </div>
  );
}