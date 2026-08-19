interface ManualFormStepperProps {
  activeStep: number;
  steps: string[];
}

export function ManualFormStepper({ activeStep, steps }: ManualFormStepperProps) {
  const progressWidth = `${(Math.max(1, activeStep) / steps.length) * 100}%`;

  return (
    <div className="border-b border-[#e3e3e3] bg-white px-[24px] pb-[9px] pt-[10px]">
      <div className="flex w-full items-start">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const active = stepNumber === activeStep;
          const completed = stepNumber < activeStep;

          return (
            <div key={step} className="relative flex flex-1 flex-col items-center">
              {index < steps.length - 1 ? (
                <div
                  className={`absolute left-1/2 right-[-50%] top-[11px] h-[2px] ${completed ? 'bg-[#C8A064]' : 'bg-[#d1d1d1]'}`}
                />
              ) : null}
              <div
                className={`relative z-[1] flex h-[22px] w-[22px] items-center justify-center rounded-full border text-[9px] font-bold ${
                  completed
                    ? 'border-0 bg-[#C8A064] text-white'
                    : active
                    ? 'border-[2px] border-[#C8A064] bg-white text-[#C8A064]'
                    : 'border-[1.5px] border-[#d1d1d1] bg-white text-[#9aa0a6]'
                }`}
              >
                {completed ? '✓' : stepNumber}
              </div>
              <span
                className={`mt-[3px] text-[8px] ${
                  active || completed ? 'font-semibold text-[#7A5A2B]' : 'text-[#9aa0a6]'
                }`}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-[6px] h-[2px] rounded-[2px] bg-[#e3e3e3]">
        <div className="h-[2px] rounded-[2px] bg-[#7A5A2B]" style={{ width: progressWidth }} />
      </div>
    </div>
  );
}
