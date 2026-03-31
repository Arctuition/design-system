import svgPaths from "./svg-p3vwb9xy05";

function Icon() {
  return (
    <div className="h-[80px] overflow-clip relative shrink-0 w-full" data-name="Icon">
      <div className="absolute inset-[41.03%_30.84%_37.04%_30.84%]" data-name="Vector">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 30.6599 17.5452">
          <path d={svgPaths.p9902000} fill="var(--fill-0, #262626)" id="Vector" />
        </svg>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative shrink-0 size-[80px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="bg-[#f0f0f0] h-[128px] relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-row items-center justify-center size-full">
        <div className="content-stretch flex items-center justify-center px-[99px] relative size-full">
          <Container1 />
        </div>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g clipPath="url(#clip0_59_27166)" id="Icon">
          <path d={svgPaths.pce65a00} id="Vector" stroke="var(--stroke-0, #BFBFBF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.p31b8ff80} id="Vector_2" stroke="var(--stroke-0, #BFBFBF)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
        <defs>
          <clipPath id="clip0_59_27166">
            <rect fill="white" height="14" width="14" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Frame() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[18px] relative shrink-0 text-[#262626] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        chevron-down-small-16x12
      </p>
      <Icon1 />
    </div>
  );
}

function Name() {
  return (
    <div className="relative rounded-[2px] shrink-0" data-name="name">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start px-[30px] py-[12px] relative">
        <Frame />
      </div>
    </div>
  );
}

function Icon2() {
  return (
    <div className="relative shrink-0 size-[14px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
        <g id="Icon">
          <path d={svgPaths.p34aacb00} id="Vector" stroke="var(--stroke-0, #262626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d={svgPaths.p27169580} id="Vector_2" stroke="var(--stroke-0, #262626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
          <path d="M7 8.75V1.75" id="Vector_3" stroke="var(--stroke-0, #262626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.16667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="relative rounded-[2px] shrink-0 w-[254px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center justify-center px-[12px] py-[8px] relative w-full">
        <Icon2 />
        <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[19.5px] relative shrink-0 text-[#262626] text-[13px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Download SVG
        </p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="content-stretch flex flex-col gap-[6px] items-start pl-[12px] py-[12px] relative w-full">
        <Name />
        <Button />
      </div>
    </div>
  );
}

export default function IconologyPage() {
  return (
    <div className="bg-white content-stretch flex flex-col items-start p-px relative rounded-[8px] size-full" data-name="IconologyPage">
      <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_10px_15px_0px_rgba(0,0,0,0.1),0px_4px_6px_0px_rgba(0,0,0,0.1)]" />
      <Container />
      <Container2 />
    </div>
  );
}