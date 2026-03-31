import svgPaths from "./svg-573fdnk0rv";
import imgProposal from "figma:asset/4a96ef54ee4644cb8cf1bcc960250e99209047ab.png";
import imgImg11971 from "figma:asset/b2bae1cb3e7da5d4f62ace1727eff9fb9e83bff5.png";
import { imgGroup } from "./svg-xv1gs";

function Logotype() {
  return (
    <div className="h-[14px] relative shrink-0 w-[57px]" data-name="logotype">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 57 14">
        <g clipPath="url(#clip0_1_4236)" id="logotype">
          <path d={svgPaths.p1789e900} fill="var(--fill-0, white)" id="Vector" />
          <path d={svgPaths.p1f3a2ef0} fill="var(--fill-0, white)" id="Vector_2" />
          <path d={svgPaths.p3dbda200} fill="var(--fill-0, white)" id="Vector_3" />
          <path d={svgPaths.p3fd86700} fill="var(--fill-0, white)" id="Vector_4" />
          <path d={svgPaths.p9e11f00} fill="var(--fill-0, white)" id="Vector_5" />
          <path d={svgPaths.p1d624600} fill="var(--fill-0, white)" id="Vector_6" />
          <path d={svgPaths.p12113580} fill="var(--fill-0, white)" id="Vector_7" />
        </g>
        <defs>
          <clipPath id="clip0_1_4236">
            <rect fill="white" height="14" width="57" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function ArcSite() {
  return (
    <div className="content-stretch flex gap-[12px] h-[32px] items-center relative shrink-0" data-name="ArcSite">
      <Logotype />
      <div className="bg-[#d9d9d9] h-[24px] shrink-0 w-px" />
      <p className="font-['SF_Pro_Display:Light',sans-serif] leading-[24px] not-italic relative shrink-0 text-[14px] text-white whitespace-nowrap">Design System</p>
    </div>
  );
}

function Logo() {
  return (
    <div className="content-stretch flex gap-[10px] items-start justify-end relative shrink-0 w-full" data-name="logo">
      <ArcSite />
    </div>
  );
}

function Master() {
  return (
    <div className="bg-[#ffb82e] content-stretch flex items-center px-[8.304px] py-[4.152px] relative rounded-[997.375px] shrink-0" data-name="master">
      <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[4.051px] not-italic relative shrink-0 text-[#202020] text-[3.79px] text-right uppercase whitespace-nowrap">WIP</p>
    </div>
  );
}

function Title() {
  return (
    <div className="content-stretch flex gap-[16px] items-center pb-[24px] relative shrink-0" data-name="title">
      <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[0] not-italic relative shrink-0 text-[#f5f5f5] text-[0px] whitespace-nowrap">
        <span className="leading-[36px] text-[28px]">{`Web View `}</span>
        <span className="font-['SF_Pro_Display:Light',sans-serif] leading-[36px] text-[16px]">(Ver 0.5)</span>
      </p>
      <div className="content-stretch flex h-[23.937px] items-center relative shrink-0 w-[45.489px]" data-name="❌ deprecated - status-badge">
        <Master />
      </div>
    </div>
  );
}

function XdTeam() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-[122px]" data-name="XD team">
      <p className="font-['SF_Pro_Display:Regular',sans-serif] leading-[18px] min-w-full not-italic relative shrink-0 text-[12px] text-[rgba(245,245,245,0.7)] w-[min-content]">Designer</p>
      <div className="content-stretch flex items-center relative shrink-0" data-name="text-link">
        <p className="font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#6dd2ff] text-[14px] whitespace-nowrap">Junyu Zhang</p>
      </div>
    </div>
  );
}

function Contact() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[8px] items-start min-h-px min-w-px relative" data-name="Contact">
      <p className="font-['SF_Pro_Display:Regular',sans-serif] leading-[18px] min-w-full not-italic relative shrink-0 text-[12px] text-[rgba(245,245,245,0.7)] w-[min-content]">UI Toolkit | Component</p>
      <div className="content-stretch flex items-center relative shrink-0" data-name="text-link">
        <a className="block font-['SF_Pro_Display:Regular',sans-serif] leading-[0] not-italic relative shrink-0 text-[#6dd2ff] text-[14px] whitespace-nowrap" href="https://www.figma.com/design/8z7XDjfLoXJw87qv6YRD83/UI-Toolkits?node-id=1-2">
          <p className="cursor-pointer leading-[20px]">Web View</p>
        </a>
      </div>
    </div>
  );
}

function Info() {
  return (
    <div className="content-stretch flex gap-[32px] items-start relative shrink-0 w-full" data-name="Info">
      <XdTeam />
      <Contact />
    </div>
  );
}

function Header1() {
  return (
    <div className="bg-[#445367] relative shrink-0 w-full" data-name="header">
      <div className="content-stretch flex flex-col gap-[12px] items-start pb-[24px] pl-[64px] pr-[32px] pt-[16px] relative w-full">
        <Logo />
        <Title />
        <Info />
      </div>
    </div>
  );
}

function Contentt() {
  return <div className="bg-white content-stretch flex h-px items-start shrink-0 w-full" data-name="contentt" />;
}

function Header() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col items-start left-[-3px] right-0 top-0" data-name="Header">
      <Header1 />
      <Contentt />
    </div>
  );
}

function Body() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="body">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <p className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[14px]">The Web View is a container used to display web content within the app interface. It facilitates embedding web-based content within the mobile and tablet application, allowing reuse of existing web modules while maintaining a cohesive in-app experience.</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <p className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[14px]">A Web View enables ArcSite to surface web-based functionality inside the native mobile or tablet app, bridging web modules and native workflows. It is primarily used when a native implementation is impractical or when leveraging a web-based feature is more efficient.</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] text-[14px] whitespace-pre-wrap">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] mb-0">Format Variants</p>
          <p className="leading-[20px] mb-0">To accommodate different workflow scopes and user needs, the Web View is presented in three distinct styles:</p>
          <p className="leading-[20px] mb-0">&nbsp;</p>
          <ul className="list-disc mb-0">
            <li className="mb-[8px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Modal Web View:</span>
              <span className="leading-[20px]">{` A web view displayed as a modal overlay on top of the current context.`}</span>
            </li>
            <li className="mb-[8px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Full-Screen Web View (Single-Page):</span>
              <span className="leading-[20px]">{` A full-screen web view for a single, self-contained web page.`}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Full-Screen Web View (Multi-Page/Modal):</span>
              <span className="leading-[20px]">{` A full-screen web view that supports multiple pages or an entire module in a standalone, browser-like environment.`}</span>
            </li>
          </ul>
          <p className="leading-[20px] mb-0">&nbsp;</p>
          <p className="leading-[20px]">This multi-variant ensures that web content is shown in an appropriate format—ranging from lightweight modals to immersive full-screen experiences—based on the complexity of the task. All Web View variants share common native elements (like a header with a close control) to provide a consistent user experience and to clearly delineate the web content from the native app. In every case, users can easily exit the Web View and return to the ArcSite app context at any time, guaranteeing that embedded web content never traps the user.</p>
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] whitespace-pre-wrap">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] mb-0 text-[14px]">Recommendations</p>
          <ul className="list-disc">
            <li className="mb-[8px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">{`Use a Web View for content that is external to the app’s core codebase – for example, user site management page, interactive help guide, or terms and conditions hosted online. It is appropriate when the content may need to be updated frequently on the web or when a feature is already implemented as a web page. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">{`Avoid using a Web View for simple confirmations or inputs that can be achieved with native dialogs or controls; native components should be preferred for better performance and accessibility if the content is static or straightforward. `}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Overview1() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[692px]" data-name="Overview">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[48px] relative shrink-0 w-full" data-name="Overview">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[36px] not-italic relative shrink-0 text-[#3c3c3c] text-[28px] w-full">Overview</p>
        <div className="bg-[rgba(60,60,60,0.1)] h-px shrink-0 w-full" data-name="divider" />
      </div>
      <Body />
    </div>
  );
}

function Frame20() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame18() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame20 />
        </div>
      </div>
    </div>
  );
}

function Frame24() {
  return (
    <div className="content-stretch flex flex-col h-0 items-start relative shrink-0 w-full z-[2]">
      <div className="bg-[#398ae7] h-px shrink-0 w-[130px]" />
    </div>
  );
}

function Content() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ProductMediaModal() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[300px] isolate items-start overflow-clip relative rounded-[8px] shrink-0 w-full" data-name="Product Media Modal">
      <Frame18 />
      <Frame24 />
      <Content />
    </div>
  );
}

function Frame21() {
  return (
    <div className="absolute bg-[rgba(0,0,0,0.5)] content-stretch flex flex-col h-[381px] items-center justify-center left-[75px] px-[74px] top-[76px] w-[529px]">
      <ProductMediaModal />
    </div>
  );
}

function Group7() {
  return (
    <div className="absolute contents left-[25px] top-[34px]">
      <Frame21 />
      <div className="absolute content-stretch flex flex-col h-[101px] items-center left-[161px] top-[34px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">2</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 75 5">
                  <path d={svgPaths.p124e6100} fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col h-[95px] items-center left-[327px] top-[34px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">3</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 69 5">
                  <path d={svgPaths.p34d46780} fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col h-[95px] items-center left-[482px] top-[34px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">4</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 69 5">
                  <path d={svgPaths.p34d46780} fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bg-[#fc56a9] left-[627px] rounded-[1000px] size-[26px] top-[145px]" data-name="number">
        <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
          <p className="leading-[18px]">5</p>
        </div>
      </div>
      <div className="absolute h-[26px] left-[512px] top-[145px] w-[115px]" data-name="straight">
        <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 115 5">
            <path d={svgPaths.p2526ba80} fill="var(--fill-0, #FC56A9)" id="shape" />
          </svg>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[459px] top-[275px] w-[194px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex-[1_0_0] h-full min-h-px min-w-px relative" data-name="straight">
            <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 168 5">
                <path d={svgPaths.p1d9c0f00} fill="var(--fill-0, #FC56A9)" id="shape" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">6</p>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[568px] top-[354px] w-[85px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex-[1_0_0] h-full min-h-px min-w-px relative" data-name="straight">
            <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 59 5">
                <path d={svgPaths.p2bba7700} fill="var(--fill-0, #FC56A9)" id="shape" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">7</p>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[300px] items-center justify-center left-[130px] top-[117px] w-[12px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-scale-y-100 flex-none rotate-90">
          <div className="h-[12px] relative w-[300px]">
            <div className="absolute inset-[-4.17%_-0.17%_0_-0.17%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 301 12.5">
                <path d="M0.5 12.5V0.5H300.5V12.5" id="Vector 665" stroke="var(--stroke-0, #E84396)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[25px] top-[254px] w-[105px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">1</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative">
            <div className="flex-none rotate-180 size-full">
              <div className="relative size-full" data-name="straight">
                <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 79 1">
                    <path d="M79 1H0V0H79V1Z" fill="var(--fill-0, #FC56A9)" id="shape" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame22() {
  return (
    <div className="bg-[#f5f5f5] h-[524px] relative shrink-0 w-[692px]">
      <Group7 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[26px] not-italic relative shrink-0 text-[#3c3c3c] text-[20px] w-full">Modal Web View</p>
      </div>
      <Frame22 />
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[14px] whitespace-pre-wrap">
            <span className="leading-[30px]">{`1. Container `}</span>
            <span className="leading-[30px] text-[#3c3c3c]">(App Native Component)</span>
          </p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[14px]">An overlay container that dims the background and hosts the web view.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">{`2. Web View Header Area `}</p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[14px]">A reserved header section displaying the task title and always providing a native Done or Close control.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">3. Title (Optional)</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">{`A text label describing the current task or web page. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Leave it empty when no specific title applies.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">4. Done/Close Button</p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">A native control that allows users to exit the web view at any time, including when a loading error occurs.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">5. Progress Indicator</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">{`Appears only during web content loading. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">It disappears immediately once the loading is complete.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">6. Web Content Area</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">{`The embedded browser surface that renders web content. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">This area occupies the majority of the container and can scroll vertically when the content exceeds the visible space.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">7. Overlay Mask</p>
          <ul>
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">A semi-transparent background layer that blocks interaction with underlying content and emphasizes the modal’s focus.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Frame25() {
  return (
    <div className="h-0 relative shrink-0 w-full z-[3]">
      <div className="absolute bg-[rgba(0,0,0,0.25)] h-px left-0 top-0 w-[130px]" />
    </div>
  );
}

function Frame26() {
  return <div className="h-[24px] shrink-0 w-0" />;
}

function Frame19() {
  return (
    <div className="bg-white h-[32px] relative shrink-0 w-full z-[2]">
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[3px] py-[12px] relative size-full">
          <Frame26 />
          <div className="h-[28px] relative shrink-0 w-[24px]" data-name="app/alert message/btn-close">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-[4px] size-[24px] top-1/2" data-name="app/btn">
              <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[16px] top-1/2" data-name="icon/xmark-large-16x16">
                <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.01px)] size-[10.506px] top-[calc(50%+0.01px)]" data-name="icon">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5059 10.5059">
                    <path d={svgPaths.p2b58b00} fill="var(--fill-0, black)" fillOpacity="0.25" id="icon" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Content1() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ProductMediaModal1() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[406px] isolate items-start left-[79px] overflow-clip top-[68px] w-[536px]" data-name="Product Media Modal">
      <Frame25 />
      <Frame19 />
      <Content1 />
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-[#f5f5f5] h-[553px] relative shrink-0 w-full">
      <ProductMediaModal1 />
      <div className="absolute content-stretch flex flex-col h-[54px] items-center left-[156px] top-[17px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">3</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 28 5">
                  <path d={svgPaths.p216ac800} fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[608px] top-[71px] w-[58px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex-[1_0_0] h-full min-h-px min-w-px relative" data-name="straight">
            <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 5">
                <path d={svgPaths.p2e444800} fill="var(--fill-0, #FC56A9)" id="shape" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">4</p>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[581px] top-[276px] w-[85px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex-[1_0_0] h-full min-h-px min-w-px relative" data-name="straight">
            <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 59 5">
                <path d={svgPaths.p2bba7700} fill="var(--fill-0, #FC56A9)" id="shape" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">5</p>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col h-[42px] items-center left-[334px] top-[494px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="flex-none rotate-90 size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 1">
                  <path d="M16 1H0V0H16V1Z" fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">1</p>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[12px] items-center justify-center left-[79px] top-[482px] w-[536px]">
        <div className="-scale-y-100 flex-none">
          <div className="h-[12px] relative w-[536px]">
            <div className="absolute inset-[-4.17%_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 537 12.5">
                <path d="M0.5 12.5V0.5H536.5V12.5" id="Vector 665" stroke="var(--stroke-0, #E84396)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[31px] items-center justify-center left-[64px] top-[69px] w-[8px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-scale-y-100 flex-none rotate-90">
          <div className="h-[8px] relative w-[31px]">
            <div className="absolute inset-[-6.25%_-1.61%_0_-1.61%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 8.5">
                <path d="M0.5 8.5V0.5H31.5V8.5" id="Vector 665" stroke="var(--stroke-0, #E84396)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[18px] top-[71px] w-[46px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">2</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative">
            <div className="flex-none rotate-180 size-full">
              <div className="relative size-full" data-name="straight">
                <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 1">
                    <path d="M20 1H0V0H20V1Z" fill="var(--fill-0, #FC56A9)" id="shape" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[26px] not-italic relative shrink-0 text-[#3c3c3c] text-[20px] w-full">Full-Screen Web View (Single-Page)</p>
      </div>
      <Frame23 />
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[14px] whitespace-pre-wrap">
            <span className="leading-[30px]">{`1. Container `}</span>
            <span className="leading-[30px] text-[#3c3c3c]">(App Native Component)</span>
          </p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">A full-screen container that displays a single web page, providing an immersive browsing experience.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">The background may use a translucent color to subtly reveal the underlying context when appropriate.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">{`2. Web View Header Area `}</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">A fixed header section that includes a native Close button.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">The header background can be set to transparent to allow the container background to show through, creating a lighter visual presence.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[14px] whitespace-pre-wrap">
            <span className="leading-[30px]">{`3. `}</span>
            <span className="leading-[30px] text-[#3c3c3c]">Progress Indicator</span>
          </p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[14px]">Appears only while web content is loading and disappears immediately once loading completes.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">4. Close Button</p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">A native button with [ X ] icon that lets users exit the web view at any time, including in the event of a loading error.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">5. Web Content Area</p>
          <ul className="list-disc whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">The embedded browser surface that renders the web page.</span>
            </li>
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">It occupies the full width and remaining height of the screen, excluding the header area.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">The web page background can be set to transparent to allow the container background to show through, if the container background was translucent, it helps to subtly reveal the underlying context when appropriate.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function RightSide() {
  return (
    <div className="-translate-y-1/2 absolute h-[24px] right-[14.5px] top-1/2 w-[102px]" data-name="Right Side">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 102 24">
        <g id="Right Side">
          <path d={svgPaths.pd466e80} fill="var(--fill-0, black)" id="Combined Shape" />
          <path d={svgPaths.p23171c00} fill="var(--fill-0, black)" id="Combined Shape_2" />
          <g id="100%">
            <path d={svgPaths.p321f7900} fill="var(--fill-0, black)" />
            <path d={svgPaths.p252d2280} fill="var(--fill-0, black)" />
            <path d={svgPaths.p2c01e300} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1ccbee80} fill="var(--fill-0, black)" />
          </g>
          <g id="Battery Icon">
            <g id="Combined Shape_3" opacity="0.4">
              <mask fill="white" id="path-4-inside-1_1_4189">
                <path d={svgPaths.p17d98780} />
              </mask>
              <path d={svgPaths.p38a41530} fill="var(--stroke-0, black)" mask="url(#path-4-inside-1_1_4189)" />
            </g>
            <rect fill="var(--fill-0, black)" height="8" id="Capacity" rx="1.5" width="20" x="76.9763" y="8" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function LeftSide() {
  return (
    <div className="-translate-y-1/2 absolute h-[8.865px] left-[16px] top-1/2 w-[88.872px]" data-name="Left Side">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 88.8718 8.86523">
        <g id="Left Side">
          <g id="Time">
            <path d={svgPaths.p22db1780} fill="var(--fill-0, black)" />
            <path d={svgPaths.p2cdb3900} fill="var(--fill-0, black)" />
            <path d={svgPaths.p14f1d600} fill="var(--fill-0, black)" />
            <path d={svgPaths.p537c900} fill="var(--fill-0, black)" />
          </g>
          <g id="Date">
            <path d={svgPaths.p89b9270} fill="var(--fill-0, black)" />
            <path d={svgPaths.p193fbc00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p22edb200} fill="var(--fill-0, black)" />
            <path d={svgPaths.p329ffd80} fill="var(--fill-0, black)" />
            <path d={svgPaths.pfc08200} fill="var(--fill-0, black)" />
            <path d={svgPaths.p1aca4f00} fill="var(--fill-0, black)" />
            <path d={svgPaths.p758c300} fill="var(--fill-0, black)" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="bg-white h-[24px] relative shrink-0 w-full" data-name="Status Bar">
      <RightSide />
      <LeftSide />
    </div>
  );
}

function AppHeader() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full" data-name="app/header">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <div className="-translate-y-1/2 absolute content-stretch flex h-[32px] items-center justify-center right-[28px] top-1/2" data-name="navigation button">
          <div className="flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[15px] text-right whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
            <p className="leading-[20px]">Done</p>
          </div>
        </div>
        <div className="-translate-y-1/2 absolute content-stretch flex gap-[4px] items-center left-[20px] top-1/2" data-name="app/header/back" />
        <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold justify-center leading-[0] left-1/2 text-[17px] text-[rgba(0,0,0,0.85)] text-center top-1/2 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[22px]">ArcSite</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
    </div>
  );
}

function Frame14() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <StatusBar />
      <AppHeader />
    </div>
  );
}

function Frame28() {
  return (
    <div className="content-stretch flex flex-col h-0 items-start relative shrink-0 w-full">
      <div className="bg-[#398ae7] h-px shrink-0 w-[130px]" />
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full z-[3]">
      <Frame14 />
      <Frame28 />
    </div>
  );
}

function Content2() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px relative w-full z-[2]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function Proposal() {
  return (
    <div className="absolute bg-[#fafafa] h-[400px] left-[68px] rounded-[20px] top-[69px] w-[560px]" data-name="Proposal">
      <div className="content-stretch flex flex-col isolate items-start overflow-clip relative rounded-[inherit] size-full">
        <Frame15 />
        <Content2 />
      </div>
      <div aria-hidden="true" className="absolute border-6 border-black border-solid inset-[-6px] pointer-events-none rounded-[26px]" />
    </div>
  );
}

function Frame27() {
  return (
    <div className="bg-[#f5f5f5] h-[553px] relative shrink-0 w-[692px]">
      <Proposal />
      <div className="absolute content-stretch flex flex-col h-[79px] items-center left-[332px] top-[23px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">3</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 53 5">
                  <path d={svgPaths.p1b7ae9f0} fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col h-[113px] items-center left-[128px] top-[23px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">5</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="-rotate-90 flex-none size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 87 5">
                  <path d={svgPaths.p28782c80} fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[606px] top-[102px] w-[64px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex-[1_0_0] h-full min-h-px min-w-px relative" data-name="straight">
            <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 38 5">
                <path d={svgPaths.p31286680} fill="var(--fill-0, #FC56A9)" id="shape" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">4</p>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[585px] top-[271px] w-[85px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex-[1_0_0] h-full min-h-px min-w-px relative" data-name="straight">
            <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 59 5">
                <path d={svgPaths.p2bba7700} fill="var(--fill-0, #FC56A9)" id="shape" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">6</p>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex flex-col h-[42px] items-center left-[326px] top-[487px]" data-name="Pointer with number">
        <div className="flex flex-[1_0_0] items-center justify-center min-h-px min-w-px relative w-full" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
          <div className="flex-none rotate-90 size-full">
            <div className="relative size-full" data-name="straight">
              <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 1">
                  <path d="M16 1H0V0H16V1Z" fill="var(--fill-0, #FC56A9)" id="shape" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">1</p>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[12px] items-center justify-center left-[68px] top-[475px] w-[560px]">
        <div className="-scale-y-100 flex-none">
          <div className="h-[12px] relative w-[560px]">
            <div className="absolute inset-[-4.17%_0_0_0]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 561 12.5">
                <path d="M0.5 12.5V0.5H560.5V12.5" id="Vector 665" stroke="var(--stroke-0, #E84396)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute flex h-[40px] items-center justify-center left-[51px] top-[93px] w-[8px]" style={{ "--transform-inner-width": "1200", "--transform-inner-height": "19" } as React.CSSProperties}>
        <div className="-scale-y-100 flex-none rotate-90">
          <div className="h-[8px] relative w-[40px]">
            <div className="absolute inset-[-6.25%_-1.25%_0_-1.25%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 41 8.5">
                <path d="M0.5 8.5V0.5H40.5V8.5" id="Vector 665" stroke="var(--stroke-0, #E84396)" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute content-stretch flex items-center left-[15px] top-[100px] w-[36px]" data-name="Pointer with number">
        <div className="bg-[#fc56a9] relative rounded-[1000px] shrink-0 size-[26px]" data-name="number">
          <div className="absolute flex flex-col font-['SF_Pro_Display:Bold',sans-serif] inset-0 justify-center leading-[0] not-italic text-[12px] text-center text-white">
            <p className="leading-[18px]">2</p>
          </div>
        </div>
        <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
          <div className="flex flex-[1_0_0] h-full items-center justify-center min-h-px min-w-px relative">
            <div className="flex-none rotate-180 size-full">
              <div className="relative size-full" data-name="straight">
                <div className="-translate-y-1/2 absolute h-[5px] left-0 right-0 top-[calc(50%-0.5px)]" data-name="shape">
                  <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 1">
                    <path d="M10 1H0V0H10V1Z" fill="var(--fill-0, #FC56A9)" id="shape" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[26px] not-italic relative shrink-0 text-[#3c3c3c] text-[20px] w-full">Full-Screen Web View (Multi-Page/Modal)</p>
      </div>
      <Frame27 />
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[14px] whitespace-pre-wrap">
            <span className="leading-[30px]">{`1. Container `}</span>
            <span className="leading-[30px] text-[#3c3c3c]">(App Native Component)</span>
          </p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">A full-screen container that provides a browser-like experience to support multi-step or self-contained workflows within specific modules.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">The background must use a solid color and should not reveal any underlying context.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">{`2. Web View Header Area `}</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">A fixed header section that displays the module title and always includes a native Done or Close control.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">The header background color should remain consistent across all web views of this type.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[14px] whitespace-pre-wrap">
            <span className="leading-[30px]">{`3. `}</span>
            <span className="leading-[30px]">Title</span>
          </p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">{`A text label identifying the current module or web page. `}</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">4. Close Button</p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">A native control that allows users to exit the web view at any time, including when a loading error occurs.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[14px] whitespace-pre-wrap">
            <span className="leading-[30px]">{`5. `}</span>
            <span className="leading-[30px] text-[#3c3c3c]">Progress Indicator</span>
          </p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[14px]">Appears only while web content is loading and disappears immediately once the loading completes.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">6. Web Content Area</p>
          <ul className="list-disc whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">The embedded browser surface that renders web content.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">It occupies the full width and remaining height of the screen, excluding the header area.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Anatomy() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Anatomy">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Anatomy</p>
      </div>
      <Frame3 />
      <Frame4 />
      <Frame5 />
    </div>
  );
}

function Body1() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="body">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <p className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[14px]">Each Web View variant is suited to specific scenarios. Use the variant that best matches the scope of the task and the desired user experience:</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] whitespace-pre-wrap">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Modal Web View</p>
          <p className="mb-0 text-[14px]">{`Use for short, focused tasks that require user input or confirmation without full departure from the current context. `}</p>
          <p className="text-[14px]">Modal Web Views appear as an overlay atop the existing screen, allowing users to maintain a sense of place in the app. They are ideal for scenarios like quick form inputs, single-step confirmations, or brief content displays. Do not use a modal Web View for workflows that involve navigating between multiple pages or lengthy processes. Also, never launch another modal or Web View from within a Modal Web View – nested modal web views are not allowed, as they would stack overlays and confuse the user.</p>
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] whitespace-pre-wrap">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Full-Screen Web View (Single-Page)</p>
          <p className="mb-0 text-[14px]">{`Use for immersive tasks that can be completed within one web page. `}</p>
          <p className="text-[14px]">This variant takes over the entire screen to minimize distraction, making it suitable for content that benefits from a larger display area or focused user attention – for example, viewing a detailed document/media, filling out a single-page web form, or displaying an information page. Do not use the single-page full-screen variant for multi-step workflows or any process requiring inter-page navigation. If the user needs to navigate to additional pages or steps, choose the multi-page variant instead. The single-page Web View should be reserved for self-contained experiences where the only navigation required is to close the view when done.</p>
        </div>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] whitespace-pre-wrap">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Full-Screen Web View (Multi-Page/Modal)</p>
          <p className="mb-0 text-[14px]">{`Use for stand-alone modules or complex workflows that involve multiple web pages or a non-linear navigation flow. `}</p>
          <p className="text-[14px]">This variant provides a full-screen, browser-like experience within ArcSite, suitable for self-contained web modules such as a Proposal Details view or an in-app Help Center. Users can navigate between pages freely in any order within this Web View, as it is designed to handle multi-page content and even in-module modal dialogs if necessary. Always use this variant when the web content constitutes a mini-application or extended experience; it gives users the flexibility of a web browser (e.g. following links, viewing multiple pages) while keeping them within the ArcSite environment. Ensure that the content presented here is comprehensive enough to warrant a dedicated full-screen module. Avoid using the multi-page Web View for simple tasks, as its capabilities (and overhead) would be excessive for trivial content.</p>
        </div>
      </div>
    </div>
  );
}

function Principles() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Principles">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Usage</p>
      </div>
      <Body1 />
    </div>
  );
}

function IconWrapper() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="icon-wrapper">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="icon-wrapper">
          <path d={svgPaths.p23559a00} fill="var(--fill-0, #DD2222)" id="icon-shape" />
        </g>
      </svg>
    </div>
  );
}

function Frame32() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[10px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[14px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame31() {
  return (
    <div className="bg-white h-[31px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[12px] min-h-px min-w-px relative text-[10px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Setting | ArcSite
          </p>
          <Frame32 />
        </div>
      </div>
    </div>
  );
}

function Frame33() {
  return <div className="h-0 shrink-0 w-full z-[2]" />;
}

function Frame34() {
  return (
    <div className="content-stretch flex items-start relative shrink-0 z-[1]">
      <div className="h-[265px] relative shrink-0 w-[23px]" data-name="IMG_1197 1">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[151.04%] left-0 max-w-none top-[-11.75%] w-[2526.09%]" src={imgImg11971} />
        </div>
      </div>
      <div className="h-[265px] relative shrink-0 w-[288px]" data-name="IMG_1197 3">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img alt="" className="absolute h-[151.04%] left-[-58.68%] max-w-none top-[-12.5%] w-[201.74%]" src={imgImg11971} />
        </div>
      </div>
    </div>
  );
}

function ProductMediaModal2() {
  return (
    <div className="bg-white content-stretch flex flex-col isolate items-start overflow-clip relative rounded-[8px] shrink-0 w-[311px]" data-name="Product Media Modal">
      <Frame31 />
      <Frame33 />
      <Frame34 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="bg-[rgba(0,0,0,0.5)] h-[360px] relative shrink-0 w-full z-[1]">
      <div className="flex flex-col items-center justify-center size-full">
        <div className="content-stretch flex flex-col items-center justify-center px-[74px] relative size-full">
          <ProductMediaModal2 />
        </div>
      </div>
    </div>
  );
}

function Proposal1() {
  return (
    <div className="col-1 h-[360px] ml-[75px] mt-[63px] relative rounded-[10px] row-1 w-[523px]" data-name="Proposal">
      <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none rounded-[10px] size-full" src={imgProposal} />
      <div className="content-stretch flex flex-col isolate items-start overflow-clip relative rounded-[inherit] size-full">
        <Frame30 />
      </div>
      <div aria-hidden="true" className="absolute border-6 border-black border-solid inset-[-6px] pointer-events-none rounded-[16px]" />
    </div>
  );
}

function Group11() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="bg-white border border-[rgba(60,60,60,0.1)] border-solid col-1 h-[517px] ml-0 mt-0 overflow-clip relative row-1 w-[692px]" data-name="Image background">
        <div className="absolute bg-[#d22] bottom-[-1px] h-[8px] left-[-1px] right-[-1px]" />
        <div className="absolute bottom-[19px] content-stretch flex items-start left-[11px]" data-name="error">
          <IconWrapper />
        </div>
      </div>
      <Proposal1 />
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <Group11 />
      <div className="font-['SF_Pro_Display:Regular',sans-serif] italic leading-[20px] min-w-full not-italic relative shrink-0 text-[#3c3c3c] text-[14px] w-[min-content]">
        <p className="font-['SF_Pro_Display:Bold_Italic',sans-serif] mb-0">Don’t</p>
        <p className="font-['SF_Pro_Display:Light_Italic',sans-serif]">Avoiding using inappropriate variant for certain task. E.g. using the Modal Web View variant for complex non-linear navigating advance setting workflows.</p>
      </div>
    </div>
  );
}

function Frame29() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Choose the appropriate Web View variant for the task</p>
          <p className="text-[14px]">Always match the Web View style to the user’s goal. For simple or brief tasks, prefer the Modal Web View to keep the user in context. For single-step immersive content, use the full-screen single-page view. Reserve the full-screen multi-page view for complex, self-contained modules. This ensures users are not overwhelmed with a heavy interface for a simple task, and conversely, not constrained by a lightweight overlay for a complex workflow.</p>
        </div>
      </div>
      <Frame10 />
    </div>
  );
}

function IconWrapper1() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="icon-wrapper">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="icon-wrapper">
          <path d={svgPaths.p1a1eb600} fill="var(--fill-0, #6A9728)" id="icon-shape" />
        </g>
      </svg>
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame36() {
  return (
    <div className="absolute bg-white content-stretch flex h-[40px] items-center justify-end left-0 px-[18px] py-[12px] top-0 w-[381px]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
        Title
      </p>
      <Frame37 />
    </div>
  );
}

function Frame38() {
  return <div className="absolute content-stretch flex flex-col h-0 items-start left-0 top-[40px] w-[381px]" />;
}

function ActionRight() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0" data-name="action-right">
      <div className="bg-white content-stretch flex h-[32px] items-center justify-center px-[16px] py-[6px] relative rounded-[4px] shrink-0" data-name="right btn-secondary">
        <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[4px]" />
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(0,0,0,0.85)] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[18px]">Back</p>
        </div>
      </div>
      <div className="bg-[#398ae7] content-stretch flex h-[32px] items-center justify-center px-[16px] py-[6px] relative rounded-[4px] shrink-0" data-name="right btn-primary">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[18px]">Mark as Paid</p>
        </div>
      </div>
    </div>
  );
}

function WebFooterActions() {
  return (
    <div className="absolute h-0 left-0 top-[300px] w-[381px]" data-name="web/footer-actions">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-solid border-t-[0.5px] inset-0 pointer-events-none" />
      <div className="flex flex-row items-end size-full">
        <div className="content-stretch flex gap-[16px] items-end px-[24px] py-[12px] relative size-full">
          <div className="bg-white content-stretch flex h-[32px] items-center justify-center px-[16px] py-[6px] relative rounded-[4px] shrink-0" data-name="left btn">
            <div aria-hidden="true" className="absolute border border-[#e31c1c] border-solid inset-0 pointer-events-none rounded-[4px]" />
            <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#e31c1c] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[18px]">Discard</p>
            </div>
          </div>
          <div className="flex-[1_0_0] h-full min-h-px min-w-px" data-name="spacer" />
          <ActionRight />
        </div>
      </div>
    </div>
  );
}

function Content3() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[260px] items-center justify-center left-0 mix-blend-multiply top-[40px] w-[381px]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ProductMediaModal3() {
  return (
    <div className="bg-white col-1 h-[300px] ml-[156px] mt-[47px] overflow-clip relative rounded-[8px] row-1 shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] w-[381px]" data-name="Product Media Modal">
      <Frame36 />
      <Frame38 />
      <WebFooterActions />
      <Content3 />
    </div>
  );
}

function Group12() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="bg-white border border-[rgba(60,60,60,0.1)] border-solid col-1 h-[393px] ml-0 mt-0 overflow-clip relative row-1 w-[692px]" data-name="Image background">
        <div className="absolute bg-[#6a9728] bottom-[-1px] h-[8px] left-[-1px] right-[-1px]" />
        <div className="absolute bottom-[19px] content-stretch flex items-start left-[11px]" data-name="complete">
          <IconWrapper1 />
        </div>
      </div>
      <ProductMediaModal3 />
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[692px]">
      <Group12 />
      <div className="font-['SF_Pro_Display:Regular',sans-serif] italic leading-[20px] min-w-full not-italic relative shrink-0 text-[#3c3c3c] text-[14px] w-[min-content]">
        <p className="font-['SF_Pro_Display:Bold_Italic',sans-serif] mb-0">Do</p>
        <p className="font-['SF_Pro_Display:Light_Italic',sans-serif]">Handling the specific functionality within the web content.</p>
      </div>
    </div>
  );
}

function IconWrapper2() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="icon-wrapper">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="icon-wrapper">
          <path d={svgPaths.p23559a00} fill="var(--fill-0, #DD2222)" id="icon-shape" />
        </g>
      </svg>
    </div>
  );
}

function Frame40() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame39() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[4]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame40 />
        </div>
      </div>
    </div>
  );
}

function Frame41() {
  return <div className="content-stretch flex flex-col h-0 items-start shrink-0 w-full z-[3]" />;
}

function Content4() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px relative w-full z-[2]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ActionRight1() {
  return (
    <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0" data-name="action-right">
      <div className="bg-white content-stretch flex h-[32px] items-center justify-center px-[16px] py-[6px] relative rounded-[4px] shrink-0" data-name="right btn-secondary">
        <div aria-hidden="true" className="absolute border border-[#d9d9d9] border-solid inset-0 pointer-events-none rounded-[4px]" />
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-[rgba(0,0,0,0.85)] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[18px]">Back</p>
        </div>
      </div>
      <div className="bg-[#398ae7] content-stretch flex h-[32px] items-center justify-center px-[16px] py-[6px] relative rounded-[4px] shrink-0" data-name="right btn-primary">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[18px]">Mark as Paid</p>
        </div>
      </div>
    </div>
  );
}

function WebFooterActions1() {
  return (
    <div className="relative shrink-0 w-full z-[1]" data-name="web/footer-actions">
      <div className="flex flex-row items-center overflow-clip rounded-[inherit] size-full">
        <div className="content-stretch flex gap-[16px] items-center px-[24px] py-[12px] relative w-full">
          <div className="bg-white content-stretch flex h-[32px] items-center justify-center px-[16px] py-[6px] relative rounded-[4px] shrink-0" data-name="left btn">
            <div aria-hidden="true" className="absolute border border-[#e31c1c] border-solid inset-0 pointer-events-none rounded-[4px]" />
            <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#e31c1c] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
              <p className="leading-[18px]">Discard</p>
            </div>
          </div>
          <div className="flex flex-[1_0_0] flex-row items-center self-stretch">
            <div className="flex-[1_0_0] h-full min-h-px min-w-px" data-name="spacer" />
          </div>
          <ActionRight1 />
        </div>
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-solid border-t-[0.5px] inset-0 pointer-events-none" />
    </div>
  );
}

function ProductMediaModal4() {
  return (
    <div className="bg-white col-1 content-stretch flex flex-col h-[300px] isolate items-start ml-[156px] mt-[47px] overflow-clip relative rounded-[8px] row-1 shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] w-[381px]" data-name="Product Media Modal">
      <Frame39 />
      <Frame41 />
      <Content4 />
      <WebFooterActions1 />
    </div>
  );
}

function Group13() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="bg-white border border-[rgba(60,60,60,0.1)] border-solid col-1 h-[393px] ml-0 mt-0 overflow-clip relative row-1 w-[692px]" data-name="Image background">
        <div className="absolute bg-[#d22] bottom-[-1px] h-[8px] left-[-1px] right-[-1px]" />
        <div className="absolute bottom-[19px] content-stretch flex items-start left-[11px]" data-name="error">
          <IconWrapper2 />
        </div>
      </div>
      <ProductMediaModal4 />
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <Group13 />
      <div className="font-['SF_Pro_Display:Regular',sans-serif] italic leading-[20px] min-w-full not-italic relative shrink-0 text-[#3c3c3c] text-[14px] w-[min-content]">
        <p className="font-['SF_Pro_Display:Bold_Italic',sans-serif] mb-0">Don’t</p>
        <p className="font-['SF_Pro_Display:Light_Italic',sans-serif]">Avoiding handling the specific functionality with the native controls.</p>
      </div>
    </div>
  );
}

function Frame35() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Maintain a clear separation between native controls and web content</p>
          <p className="text-[14px]">Each Web View variant is designed with a separation of concerns in mind – native UI elements (headers, close buttons, etc.) frame the experience, while the web content is confined to its area. Do not attempt to replicate native navigation or close controls within the web content itself. Likewise, the native container should not interfere with content rendering beyond providing the frame and controls. This separation ensures that the user always knows how to navigate or exit (via native controls) and that the web content has a dedicated, well-defined space to function. It also simplifies implementation by delineating responsibilities: the native container handles the windowing and lifecycle (e.g., opening, closing, overlay behavior), and the web content handles the specific functionality or information being presented.</p>
        </div>
      </div>
      <Frame11 />
      <Frame12 />
    </div>
  );
}

function IconWrapper3() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="icon-wrapper">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="icon-wrapper">
          <path d={svgPaths.p1a1eb600} fill="var(--fill-0, #6A9728)" id="icon-shape" />
        </g>
      </svg>
    </div>
  );
}

function Frame45() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame44() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame45 />
        </div>
      </div>
    </div>
  );
}

function Frame46() {
  return <div className="content-stretch flex flex-col h-0 items-start shrink-0 w-full z-[2]" />;
}

function Content5() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px opacity-0 relative w-full z-[1]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ProductMediaModal5() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[300px] isolate items-start left-[-66px] overflow-clip rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] top-[21px] w-[275px]" data-name="Product Media Modal">
      <Frame44 />
      <Frame46 />
      <Content5 />
    </div>
  );
}

function Frame43() {
  return (
    <div className="col-1 h-[166px] ml-[64px] mt-[44px] relative row-1 w-[232px]">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <ProductMediaModal5 />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.2)] border-b-[0.5px] border-dashed border-l-[0.5px] inset-[0_0_-0.5px_-0.5px] pointer-events-none" />
    </div>
  );
}

function Group9() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="bg-white border border-[rgba(60,60,60,0.1)] border-solid col-1 h-[253px] ml-0 mt-0 overflow-clip relative row-1 w-[326px]" data-name="Image background">
        <div className="absolute bg-[#6a9728] bottom-[-1px] h-[8px] left-[-1px] right-[-1px]" />
        <div className="absolute bottom-[19px] content-stretch flex items-start left-[11px]" data-name="complete">
          <IconWrapper3 />
        </div>
      </div>
      <Frame43 />
    </div>
  );
}

function Frame() {
  return (
    <div className="col-1 content-stretch flex flex-col gap-[10px] items-start ml-0 mt-0 relative row-1 w-[326px]">
      <Group9 />
      <div className="font-['SF_Pro_Display:Regular',sans-serif] italic leading-[20px] min-w-full not-italic relative shrink-0 text-[#3c3c3c] text-[14px] w-[min-content]">
        <p className="font-['SF_Pro_Display:Bold_Italic',sans-serif] mb-0">Do</p>
        <p className="font-['SF_Pro_Display:Regular_Italic',sans-serif]">Providing exit button in the header.</p>
      </div>
    </div>
  );
}

function Group8() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Frame />
    </div>
  );
}

function IconWrapper4() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="icon-wrapper">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="icon-wrapper">
          <path d={svgPaths.p23559a00} fill="var(--fill-0, #DD2222)" id="icon-shape" />
        </g>
      </svg>
    </div>
  );
}

function Frame49() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end opacity-0 p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame48() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame49 />
        </div>
      </div>
    </div>
  );
}

function Frame50() {
  return <div className="content-stretch flex flex-col h-0 items-start shrink-0 w-full z-[2]" />;
}

function Content6() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px opacity-0 relative w-full z-[1]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ProductMediaModal6() {
  return (
    <div className="absolute bg-white content-stretch flex flex-col h-[300px] isolate items-start left-[-66px] overflow-clip rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] top-[21px] w-[275px]" data-name="Product Media Modal">
      <Frame48 />
      <Frame50 />
      <Content6 />
    </div>
  );
}

function Frame47() {
  return (
    <div className="col-1 h-[166px] ml-[64px] mt-[44px] relative row-1 w-[232px]">
      <div className="overflow-clip relative rounded-[inherit] size-full">
        <ProductMediaModal6 />
      </div>
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.2)] border-b-[0.5px] border-dashed border-l-[0.5px] inset-[0_0_-0.5px_-0.5px] pointer-events-none" />
    </div>
  );
}

function Group10() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <div className="bg-white border border-[rgba(60,60,60,0.1)] border-solid col-1 h-[253px] ml-0 mt-0 overflow-clip relative row-1 w-[326px]" data-name="Image background">
        <div className="absolute bg-[#d22] bottom-[-1px] h-[8px] left-[-1px] right-[-1px]" />
        <div className="absolute bottom-[19px] content-stretch flex items-start left-[11px]" data-name="error">
          <IconWrapper4 />
        </div>
      </div>
      <Frame47 />
      <div className="col-1 h-[28px] ml-[241px] mt-[107px] relative row-1 w-[24px]" data-name="app/alert message/btn-close">
        <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 rounded-[4px] size-[24px] top-1/2" data-name="app/btn">
          <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[16px] top-1/2" data-name="icon/xmark-large-16x16">
            <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.01px)] size-[10.506px] top-[calc(50%+0.01px)]" data-name="icon">
              <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.5059 10.5059">
                <path d={svgPaths.p2b58b00} fill="var(--fill-0, black)" fillOpacity="0.25" id="icon" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[326px]">
      <Group10 />
      <div className="font-['SF_Pro_Display:Regular',sans-serif] italic leading-[20px] min-w-full not-italic relative shrink-0 text-[#3c3c3c] text-[14px] w-[min-content]">
        <p className="font-['SF_Pro_Display:Bold_Italic',sans-serif] mb-0">Don’t</p>
        <p className="font-['SF_Pro_Display:Regular_Italic',sans-serif]">Avoid providing exit within the web content</p>
      </div>
    </div>
  );
}

function Frame2() {
  return (
    <div className="content-stretch flex gap-[40px] items-start relative shrink-0 w-full">
      <Group8 />
      <Frame1 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="content-stretch flex flex-col h-[311px] items-start relative shrink-0 w-[692px]">
      <Frame2 />
    </div>
  );
}

function Frame42() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Always provide a clear exit (Done/Close) in the header</p>
          <p className="text-[14px]">A core principle of Web View usage is that the user should never feel “trapped” in a web experience. All three variants include a native Done or Close button in the header at all times. It should be highly visible and responsive. Even during multi-step web flows or content loading errors, this control must be available to let users bail out and return to the main app. Never remove or disable the close control based on web content state. If the web flow requires completion (e.g., a form submission) before returning, that should be handled within the web content; the Done/Close is an override that the user can use at their discretion.</p>
        </div>
      </div>
      <Frame9 />
    </div>
  );
}

function IconWrapper5() {
  return (
    <div className="relative shrink-0 size-[32px]" data-name="icon-wrapper">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 32 32">
        <g id="icon-wrapper">
          <path d={svgPaths.p23559a00} fill="var(--fill-0, #DD2222)" id="icon-shape" />
        </g>
      </svg>
    </div>
  );
}

function Group15() {
  return (
    <div className="col-1 grid-cols-[max-content] grid-rows-[max-content] inline-grid ml-0 mt-0 place-items-start relative row-1">
      <div className="bg-white border border-[rgba(60,60,60,0.1)] border-solid col-1 h-[526px] ml-0 mt-0 overflow-clip relative row-1 w-[692px]" data-name="Image background">
        <div className="absolute bg-[#d22] bottom-[-1px] h-[8px] left-[-1px] right-[-1px]" />
        <div className="absolute bottom-[19px] content-stretch flex items-start left-[11px]" data-name="error">
          <IconWrapper5 />
        </div>
      </div>
    </div>
  );
}

function Frame53() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame52() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Modal Web View A
          </p>
          <Frame53 />
        </div>
      </div>
    </div>
  );
}

function Content7() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ProductMediaModal7() {
  return (
    <div className="bg-white col-1 content-stretch flex flex-col h-[392px] isolate items-start ml-[170px] mt-[71px] overflow-clip relative rounded-[8px] row-1 shadow-[0px_4px_12px_0px_rgba(0,0,0,0.13),0px_5px_34px_0px_rgba(0,0,0,0.24)] w-[360px]" data-name="Product Media Modal">
      <Frame52 />
      <Content7 />
    </div>
  );
}

function Frame55() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame54() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Modal Web View B
          </p>
          <Frame55 />
        </div>
      </div>
    </div>
  );
}

function Frame56() {
  return (
    <div className="content-stretch flex flex-col h-0 items-start relative shrink-0 w-full z-[2]">
      <div className="bg-[#398ae7] h-px shrink-0 w-[130px]" />
    </div>
  );
}

function Content8() {
  return (
    <div className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="content">
      <div className="bg-[rgba(179,133,242,0.3)] flex-[1_0_0] min-h-px min-w-px relative w-full" data-name="⚙️ internal/⚙️ child-slot">
        <div className="content-stretch flex flex-col items-center justify-center overflow-clip relative rounded-[inherit] size-full">
          <p className="-translate-x-1/2 absolute font-['SF_Pro_Display:Light',sans-serif] leading-[16px] left-[calc(50%+1px)] not-italic text-[#8558c5] text-[14px] text-center top-[calc(50%-8px)] whitespace-nowrap">Web Content</p>
        </div>
        <div aria-hidden="true" className="absolute border border-[#b385f2] border-dashed inset-0 pointer-events-none" />
      </div>
    </div>
  );
}

function ProductMediaModal8() {
  return (
    <div className="bg-white col-1 content-stretch flex flex-col h-[300px] isolate items-start ml-[123px] mt-[125px] overflow-clip relative rounded-[8px] row-1 shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] w-[453px]" data-name="Product Media Modal">
      <Frame54 />
      <Frame56 />
      <Content8 />
    </div>
  );
}

function Group14() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid leading-[0] place-items-start relative shrink-0">
      <Group15 />
      <ProductMediaModal7 />
      <div className="bg-[rgba(0,0,0,0.5)] col-1 h-[471px] ml-[64px] mt-[22px] row-1 w-[571px]" />
      <ProductMediaModal8 />
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <Group14 />
      <div className="font-['SF_Pro_Display:Regular',sans-serif] italic leading-[20px] min-w-full not-italic relative shrink-0 text-[#3c3c3c] text-[14px] w-[min-content]">
        <p className="font-['SF_Pro_Display:Bold_Italic',sans-serif] mb-0">Don’t</p>
        <p className="font-['SF_Pro_Display:Light_Italic',sans-serif]">Avoiding open a new Modal Web View on top of an existing one.</p>
      </div>
    </div>
  );
}

function Frame51() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Avoid nested or sequential Web Views</p>
          <p className="text-[14px]">Do not open a new Modal Web View on top of an existing one. For example, a Modal Web View should not trigger another modal, and a single-page Web View should not navigate to a multi-page Web View. Chaining Modal Web Views leads to confusing UX and technical complexity. If a web experience cannot be handled within a single Web View instance, it likely indicates that the wrong variant is being used (for instance, a modal was used for something that should have been a full-screen module), or that the flow should be rethought. Always design web content interactions to stay within the bounds of the current Web View or to return to the native app for anything that requires a new context. In the rare case where an in-web flow absolutely requires another web view (for instance, an OAuth login redirecting to an external site), consider handling that outside of the app (e.g., in the device’s web browser) or using the multi-page variant to allow internal navigation.</p>
        </div>
      </div>
      <Frame13 />
    </div>
  );
}

function Body2() {
  return (
    <div className="content-stretch flex flex-col gap-[48px] items-start relative shrink-0 w-full" data-name="body">
      <Frame29 />
      <Frame35 />
      <Frame42 />
      <Frame51 />
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Respect context and immersion levels</p>
          <p className="text-[14px]">Each variant is intended to preserve or obscure the underlying app context to a specific degree. Modal overlays deliberately reveal some of the background to remind users they’re completing a temporary task in context. Single-page full-screen views may subtly show context through translucency to keep the experience light. Multi-page views completely hide the main app to create a self-contained environment. Do not mix these visual treatments in the wrong variant. For example, a multi-page module should not have a translucent background – it should feel like its own space (hence a solid background). By adhering to the intended backdrop and styling of each variant, you communicate the right level of focus to the user: a modal feels like a transient overlay, whereas a full-screen module feels like entering a dedicated section of the app</p>
        </div>
      </div>
    </div>
  );
}

function Principles1() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start pt-[48px] relative shrink-0" data-name="Principles">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Principles</p>
      </div>
      <Body2 />
    </div>
  );
}

function Overview() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0" data-name="Overview">
      <Overview1 />
      <Anatomy />
      <Principles />
      <Principles1 />
    </div>
  );
}

function Components1() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0" data-name="Components">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[12px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[36px] not-italic relative shrink-0 text-[#3c3c3c] text-[28px] w-full">Components</p>
        <div className="bg-[rgba(60,60,60,0.1)] h-px shrink-0 w-full" data-name="divider" />
      </div>
    </div>
  );
}

function WorkpsaceMenu() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Workpsace Menu">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Layout</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">1.Alignment</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">{`Modals are centered in the viewport. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Full-screen Web Views occupy the entire screen area, respecting system safe areas.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">2. Responsiveness</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">{`The Web View should adapt to portrait and landscape orientations. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Content must reflow responsively within the container.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">3. Scrolling</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">{`The web content area may scroll internally; with header and footer regions remain fixed. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Avoid scrolling the entire modal container.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">4. Safe Areas</p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Ensure padding respects safe zones defined by all OS platforms — avoid placing buttons near the bottom home indicator or other functional reserved areas.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">5. Keyboard Management</p>
          <ul className="mb-0">
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">When input fields are focused, the Web View should resize or shift upward to remain visible above the keyboard.</span>
            </li>
          </ul>
          <p className="leading-[20px] text-[14px] whitespace-pre-wrap">&nbsp;</p>
        </div>
      </div>
    </div>
  );
}

function Frame59() {
  return (
    <div className="bg-[#e4e4e4] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Device</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame60() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Phone/Mobile</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame61() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Tablet</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame58() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-h-px min-w-px relative">
      <Frame59 />
      <Frame60 />
      <Frame61 />
    </div>
  );
}

function Frame63() {
  return (
    <div className="bg-[rgba(221,210,236,0.8)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Width</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame64() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Screen width</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame65() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">480 – 820 pt fixed width</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame62() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-[166px]">
      <Frame63 />
      <Frame64 />
      <Frame65 />
    </div>
  );
}

function Frame67() {
  return (
    <div className="bg-[rgba(232,208,220,0.8)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Height</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame68() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Up to 80 % of viewport</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame69() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Up to 80 % of viewport, min 320 pt</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame66() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-[208px]">
      <Frame67 />
      <Frame68 />
      <Frame69 />
    </div>
  );
}

function Frame71() {
  return (
    <div className="bg-[rgba(195,218,229,0.8)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Behavior</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame72() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Bottom aligned, scrollable content</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame73() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Centered modal</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame70() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-[202px]">
      <Frame71 />
      <Frame72 />
      <Frame73 />
    </div>
  );
}

function Frame57() {
  return (
    <div className="bg-white content-stretch flex gap-px items-center relative shrink-0 w-full">
      <Frame58 />
      <Frame62 />
      <Frame66 />
      <Frame70 />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[26px] not-italic relative shrink-0 text-[#3c3c3c] text-[16px] w-full">Modal Web View</p>
      </div>
      <Frame57 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[0] not-italic relative shrink-0 text-[#3c3c3c] text-[0px] text-[16px] w-full">
          <span className="leading-[26px]">{`Full-Screen Web View (Single-Page & `}</span>
          <span className="leading-[26px]">Multi-Page</span>
          <span className="leading-[26px]">)</span>
        </p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <ul className="block flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] list-disc min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[14px] whitespace-pre-wrap">
          <li className="mb-0 ms-[21px]">
            <span className="leading-[20px]">{`Occupies the entire available screen height and width, including the system safe area. `}</span>
          </li>
          <li className="mb-0 ms-[21px]">
            <span className="leading-[20px]">{`For multi-page/step, use a consistent container size. `}</span>
          </li>
          <li className="ms-[21px]">
            <span className="leading-[20px]">Avoid resizing or repositioning between steps to maintain spatial continuity.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function WorkpsaceMenu1() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Workpsace Menu">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Size and Position</p>
      </div>
      <Frame6 />
      <Frame7 />
    </div>
  );
}

function Frame76() {
  return (
    <div className="bg-[#e4e4e4] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Property</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame77() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Overlay Color</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame78() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Background</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame79() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Corner Radius</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame80() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Shadow / Elevation</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame81() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Outer Margin</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame82() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Title Font</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame83() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Button Size</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame84() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Button Spacing</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame85() {
  return (
    <div className="bg-[rgba(228,228,228,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] not-italic relative shrink-0 text-[#666] text-[12px] whitespace-nowrap">
            <p className="leading-[16px]">Grid System</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame75() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-px items-start min-h-px min-w-px relative">
      <Frame76 />
      <Frame77 />
      <Frame78 />
      <Frame79 />
      <Frame80 />
      <Frame81 />
      <Frame82 />
      <Frame83 />
      <Frame84 />
      <Frame85 />
    </div>
  );
}

function Frame87() {
  return (
    <div className="bg-[rgba(221,210,236,0.8)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Token</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame88() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame89() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame90() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame91() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Shadow/02 Medium</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame92() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame93() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame94() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame95() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame96() {
  return (
    <div className="bg-[rgba(233,217,255,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame86() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-[166px]">
      <Frame87 />
      <Frame88 />
      <Frame89 />
      <Frame90 />
      <Frame91 />
      <Frame92 />
      <Frame93 />
      <Frame94 />
      <Frame95 />
      <Frame96 />
    </div>
  );
}

function Frame98() {
  return (
    <div className="bg-[rgba(232,208,220,0.8)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Value</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame99() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">rgba (0, 0, 0, 0.5)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame100() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">#FFFFFF</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame101() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">{`8 pt `}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame102() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">0 4 12 | rgba(0, 0, 0, 0.14)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame103() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame104() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame105() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame106() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame107() {
  return (
    <div className="bg-[rgba(255,217,236,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">TBD (Inherit DS)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame97() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-[196px]">
      <Frame98 />
      <Frame99 />
      <Frame100 />
      <Frame101 />
      <Frame102 />
      <Frame103 />
      <Frame104 />
      <Frame105 />
      <Frame106 />
      <Frame107 />
    </div>
  );
}

function Frame109() {
  return (
    <div className="bg-[rgba(195,218,229,0.8)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Bold',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Notes</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame110() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Semi-transparent backdrop</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame111() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Container background</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame112() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Rounded edges</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame113() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Medium elevation for modal depth</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame114() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Gap from container/screen edges</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame115() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Centered or leading-aligned</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame116() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Meets touch target size</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame117() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Primary right, secondary left</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame118() {
  return (
    <div className="bg-[rgba(169,225,251,0.4)] h-[26px] relative shrink-0 w-full">
      <div className="flex flex-row items-center size-full">
        <div className="content-stretch flex items-center px-[12px] relative size-full">
          <div className="flex flex-[1_0_0] flex-col font-['SF_Pro_Display:Regular',sans-serif] justify-center leading-[0] min-h-px min-w-px not-italic overflow-hidden relative text-[#666] text-[12px] text-ellipsis whitespace-nowrap">
            <p className="leading-[16px] overflow-hidden">Maintain spacing rhythm</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Frame108() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0 w-[202px]">
      <Frame109 />
      <Frame110 />
      <Frame111 />
      <Frame112 />
      <Frame113 />
      <Frame114 />
      <Frame115 />
      <Frame116 />
      <Frame117 />
      <Frame118 />
    </div>
  );
}

function Frame74() {
  return (
    <div className="bg-white content-stretch flex gap-px items-center relative shrink-0 w-full">
      <Frame75 />
      <Frame86 />
      <Frame97 />
      <Frame108 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[692px]">
      <Frame74 />
    </div>
  );
}

function WorkpsaceMenu2() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Workpsace Menu">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Style Variables</p>
      </div>
      <Frame8 />
    </div>
  );
}

function Components() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Components">
      <Components1 />
      <WorkpsaceMenu />
      <WorkpsaceMenu1 />
      <WorkpsaceMenu2 />
    </div>
  );
}

function Components3() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0" data-name="Components">
      <div className="content-stretch flex flex-col gap-[12px] items-start pt-[12px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[36px] not-italic relative shrink-0 text-[#3c3c3c] text-[28px] w-full">Behaviors</p>
        <div className="bg-[rgba(60,60,60,0.1)] h-px shrink-0 w-full" data-name="divider" />
      </div>
    </div>
  );
}

function WorkpsaceMenu3() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Workpsace Menu">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Activating and Closing</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">Entry Animation</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">{`Modal & Single Page Full Screen appear with a smooth expanding from the center or fade-in transition .`}</span>
            </li>
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Full-screen Web Views (Multi-Page) appear with a smooth upward slide.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Duration 500ms</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">Exit Animation</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">{`Modal & Single Page Full Screen dismiss with a smooth fade-out. `}</span>
            </li>
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Full-screen Web Views (Multi-Page) dismiss with a smooth downward slide.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Duration 500ms</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">Tap Outside to Dismiss</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">{`Optional for non-critical dialogs. `}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Disable for transactional or confirmation steps to prevent accidental loss.</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[14px] whitespace-pre-wrap">Explicit Close Button</p>
          <ul>
            <li className="list-disc ms-[calc(var(--list-marker-font-size,0)*1.5*1)] whitespace-pre-wrap">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Always provide a visible method to close regardless the state of web content.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function WorkpsaceMenu4() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Workpsace Menu">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Gestures</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] text-[14px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Swipe-down to Dismiss</p>
          <p className="leading-[20px] mb-0">Optionally supported for full-screen variant on phones/mobiles. When the user swipes down from the top screen edge, the Web View smoothly collapses and returns to the previous native context.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Content Scroll</p>
          <p className="leading-[20px] mb-0">Vertical scrolling is supported for web content that exceeds the viewport height. The native scrolling behavior should remain consistent with the platform’s default inertia, bounce, and scrollbar indicators.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Back Navigation</p>
          <p className="leading-[20px] mb-0">If the web content includes multiple pages, provide native “swipe →” gesture or an optional back button that triggers WebView history navigation. Either option should navigate to the previous page within the WebView history without leaving the current native context.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Common Browser Gestures (Full-Screen Web View)</p>
          <p className="leading-[20px] mb-0">For immersive full-screen web pages, system-standard browser gestures such as two-finger pinch-to-zoom, double-tap zoom, and horizontal swiping for navigation are optionally supported depends on the task (such as full screen viewing of picture). These gestures should behave as expected in a typical mobile browser, maintaining a sense of familiarity for users interacting with rich or detailed web content.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Touch Handling / Gesture Priority</p>
          <p className="leading-[20px] mb-0">When both native and web gestures are available in the same view (for example, swipe-down-to-dismiss versus scrolling within the page), gesture priority should follow a layered rule:</p>
          <ul className="list-disc mb-0 whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Web content gestures</span>
              <span className="leading-[20px]">{` (scroll, zoom, tap) take priority within the web surface area to ensure a natural browsing experience.`}</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Native system gestures</span>
              <span className="leading-[20px]">{` (swipe-to-dismiss, edge-back, modal collapse) are triggered only when the web content has reached its scroll boundary or when the gesture originates from outside the web content area.`}</span>
            </li>
          </ul>
          <p className="leading-[20px]">This coordination prevents gesture conflicts and ensures smooth, predictable interactions between the native container and embedded web content.</p>
        </div>
      </div>
    </div>
  );
}

function Frame119() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start pt-[12px] relative shrink-0 w-full" data-name="Text">
        <p className="flex-[1_0_0] font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[20px]">Location Access</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] text-[14px]">
          <p className="leading-[20px] mb-0">Some Web Views may prompt the user to share their current location—for example, to center a map, autofill an address, or associate content with a geographic place. These interactions must feel intentional, transparent, and user-initiated.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Always request location through deliberate user action</p>
          <p className="leading-[20px] mb-0">Web content should display a clear call-to-action, such as a “Use My Location” button. Avoid triggering location prompts immediately on load.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Communicate purpose clearly</p>
          <p className="leading-[20px] mb-0">If the Web View contains location-aware features, the title or a short message should indicate what data will be used for and why it matters. Example: “We’ll use your location to mark the job site on the map.”</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Support fallback workflows</p>
          <p className="leading-[20px] mb-0">Not all users will grant permission. The design should gracefully support manual alternatives—for example, letting users tap to drop a pin or enter an address by hand.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Never interrupt user flow</p>
          <p className="leading-[20px]">Permission prompts must never appear abruptly or break focus. They should arise only when the user takes a clear step to initiate the location-related behavior.</p>
        </div>
      </div>
    </div>
  );
}

function Frame120() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start pt-[12px] relative shrink-0 w-full" data-name="Text">
        <p className="flex-[1_0_0] font-['SF_Pro_Display:Bold',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[20px]">
          <span className="leading-[20px]">{`File Upload/Download and `}</span>
          <span className="leading-[20px]">Access</span>
        </p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] whitespace-pre-wrap">
          <p className="leading-[20px] mb-0 text-[14px]">Web Views occasionally include functionality to upload files (such as site photos, drawings, or documents) or allow users to download generated content like PDFs or reports. These flows must align with platform norms while keeping the experience grounded in ArcSite’s standards of clarity and containment.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-[4px] text-[16px]">Upload</p>
          <ul className="list-disc mb-0 text-[14px]">
            <li className="mb-[4px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Tie to a clear task</span>
              <span className="leading-[20px]">. Upload fields should be paired with descriptive labels or instructional text—e.g., “Attach photo of completed layout.”</span>
            </li>
            <li className="mb-[4px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Prompt only on demand</span>
              <span className="leading-[20px]">. If the user chooses an option like “Take Photo” or “Browse Files,” present any additional steps (like choosing a file source) inline and without abrupt context switching.</span>
            </li>
            <li className="mb-[4px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Respect platform expectations</span>
              <span className="leading-[20px]">. While the picker or capture interface is handled by the OS, the Web View must preserve framing and clarity—e.g., maintain a consistent header and avoid visual jumps.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Provide visible feedback</span>
              <span className="leading-[20px]">. Once a file is chosen or uploaded, show a clear status (e.g., file name, preview thumbnail, “Upload complete”).</span>
            </li>
          </ul>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0 text-[16px]">Download</p>
          <ul className="list-disc text-[14px]">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px]">{`Make downloads intentional.  `}</span>
              <span className="font-['SF_Pro_Display:Regular',sans-serif] leading-[20px]">Don’t trigger file generation or saving automatically on page load. Always provide a clear button—e.g., “Download Proposal PDF.”</span>
            </li>
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px]">{`Use affirmative language.  `}</span>
              <span className="font-['SF_Pro_Display:Regular',sans-serif] leading-[20px]">Button labels should reflect the file’s purpose and contents: “Export Estimate as CSV,” not just “Download.”</span>
            </li>
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px]">{`Provide feedback after download.  `}</span>
              <span className="font-['SF_Pro_Display:Regular',sans-serif] leading-[20px]">If the file is saved, show a toast message, inline confirmation, or post-download option like “Open” or “Share.”</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px]">{`Avoid ambiguity. `}</span>
              <span className="font-['SF_Pro_Display:Regular',sans-serif] leading-[20px]">Clarify what will happen when the button is tapped (e.g., whether it opens a share sheet, saves to local files, or previews inline).</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Frame121() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start pt-[12px] relative shrink-0 w-full" data-name="Text">
        <p className="flex-[1_0_0] font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[20px]">Other Permission Requesting</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-[692px]" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] text-[14px]">
          <p className="leading-[20px] mb-0">In some cases, the Web View may surface web content that attempts to access other device capabilities requiring user permission—such as camera, microphone, or location. These requests must be predictable, transparent, and grounded in clear user intent.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Never trigger system permission prompts automatically</p>
          <p className="leading-[20px] mb-0">Web content should never initiate a sensitive permission request on load or without a preceding user action. Requests must follow an explicit interaction, such as tapping “Take Photo” or “Enable Microphone.”</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Prime the user before prompting</p>
          <p className="leading-[20px] mb-0">When a permission might trigger a system-level dialog, provide contextual messaging just beforehand. For example: “To scan your drawing, ArcSite will need access to your camera.” This helps frame the request and avoids surprising the user.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Design around choice</p>
          <p className="leading-[20px] mb-0">Always offer a path to proceed without granting permission—for example, by allowing file upload instead of real-time capture, or by deferring the task. Do not block core app functionality solely due to a declined request.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Handle denial gracefully</p>
          <p className="leading-[20px] mb-0">If a permission is denied, communicate that visually and explain how to continue or where to re-enable access later. Provide links or guides to system settings if necessary.</p>
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] mb-0">Keep native framing visible</p>
          <p className="leading-[20px]">Even during permission interactions, the Web View container must preserve a clear native header and exit control to anchor the experience within the app context.</p>
        </div>
      </div>
    </div>
  );
}

function WorkpsaceMenu5() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Workpsace Menu">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Permission-Gated Interactions</p>
      </div>
      <Frame119 />
      <Frame120 />
      <Frame121 />
    </div>
  );
}

function Frame124() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame123() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame124 />
        </div>
      </div>
    </div>
  );
}

function Frame125() {
  return (
    <div className="content-stretch flex flex-col h-0 items-start relative shrink-0 w-full z-[2]">
      <div className="bg-[#398ae7] h-px shrink-0 w-[130px]" />
    </div>
  );
}

function Frame16() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
      <div className="relative shrink-0 size-[16px]" data-name="Vector (Stroke)">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <path d={svgPaths.p20893b00} fill="var(--fill-0, black)" fillOpacity="0.25" id="Vector (Stroke)" />
        </svg>
      </div>
      <p className="font-['Roboto:Regular',sans-serif] font-normal leading-[14px] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Loading...
      </p>
    </div>
  );
}

function Caption() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[30px] items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="Caption">
      <Frame16 />
    </div>
  );
}

function ProductMediaModal9() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[320px] isolate items-start overflow-clip relative rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] shrink-0 w-[480px]" data-name="Product Media Modal">
      <Frame123 />
      <Frame125 />
      <Caption />
    </div>
  );
}

function Frame122() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] mb-0 text-[16px]">Loading State</p>
          <p className="leading-[20px] mb-0 text-[14px]">When a Web View is first opened and the content is loading, an indicator should be present so the user isn’t staring at a blank screen:</p>
          <ul className="list-disc whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Display linear progress bar or a centered activity indicator (if possible) while content loads.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Include a label such as “Loading...” if loading exceeds 3 seconds.</span>
            </li>
          </ul>
        </div>
      </div>
      <ProductMediaModal9 />
    </div>
  );
}

function Frame128() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame127() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame128 />
        </div>
      </div>
    </div>
  );
}

function Frame129() {
  return (
    <div className="content-stretch flex flex-col h-0 items-start relative shrink-0 w-full z-[2]">
      <div className="bg-[#398ae7] h-px shrink-0 w-[130px]" />
    </div>
  );
}

function Frame17() {
  return (
    <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-full">
      <div className="relative shrink-0 size-[16px]" data-name="Vector (Stroke)">
        <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
          <path d={svgPaths.p20893b00} fill="var(--fill-0, black)" fillOpacity="0.25" id="Vector (Stroke)" />
        </svg>
      </div>
      <div className="font-['Roboto:Regular',sans-serif] font-normal leading-[14px] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="mb-0">This is taking longer than usual...</p>
        <p>You can keep waiting or try again later.</p>
      </div>
    </div>
  );
}

function Caption1() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[30px] items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="Caption">
      <Frame17 />
    </div>
  );
}

function ProductMediaModal10() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[320px] isolate items-start overflow-clip relative rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] shrink-0 w-[480px]" data-name="Product Media Modal">
      <Frame127 />
      <Frame129 />
      <Caption1 />
    </div>
  );
}

function Frame126() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Slow Network</p>
          <p className="text-[14px]">After prolonged loading (5–10 s), show a subtle message: ”This is taking longer than usual...You can keep waiting or come back later.”</p>
        </div>
      </div>
      <ProductMediaModal10 />
    </div>
  );
}

function Frame132() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame131() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[3]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame132 />
        </div>
      </div>
    </div>
  );
}

function Frame133() {
  return <div className="content-stretch flex flex-col h-0 items-start shrink-0 w-full z-[2]" />;
}

function Group18() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-0 row-1 w-[301px]" />
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-[17px] row-1 w-[301px]" />
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-[34px] row-1 w-[149px]" />
      <div className="bg-[#e6e6e6] col-1 ml-0 mt-0 row-1 size-[48px]" />
    </div>
  );
}

function Group16() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-0 row-1 w-[301px]" />
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-[17px] row-1 w-[301px]" />
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-[34px] row-1 w-[149px]" />
      <div className="bg-[#e6e6e6] col-1 ml-0 mt-0 row-1 size-[48px]" />
    </div>
  );
}

function Group17() {
  return (
    <div className="grid-cols-[max-content] grid-rows-[max-content] inline-grid place-items-start relative shrink-0">
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-0 row-1 w-[301px]" />
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-[17px] row-1 w-[301px]" />
      <div className="bg-[#e6e6e6] col-1 h-[14px] ml-[57px] mt-[34px] row-1 w-[149px]" />
      <div className="bg-[#e6e6e6] col-1 ml-0 mt-0 row-1 size-[48px]" />
    </div>
  );
}

function Caption2() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-full z-[1]" data-name="Caption">
      <div className="content-stretch flex flex-col gap-[30px] items-start leading-[0] pl-[54px] pt-[24px] relative size-full">
        <Group18 />
        <Group16 />
        <Group17 />
      </div>
    </div>
  );
}

function ProductMediaModal11() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[320px] isolate items-start overflow-clip relative rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] shrink-0 w-[480px]" data-name="Product Media Modal">
      <Frame131 />
      <Frame133 />
      <Caption2 />
    </div>
  );
}

function Frame130() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] mb-[4px] text-[16px]">Skeleton Loader</p>
          <p className="leading-[20px] mb-[4px] text-[14px]">If necessary, use skeleton loaders when the page has loaded but certain dynamic data is still loading asynchronously. This keeps the layout stable and avoids visual jumps.</p>
          <ul className="list-disc whitespace-pre-wrap">
            <li className="mb-[4px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Skeletons should closely reflect the final content layout (e.g., text blocks, image placeholders) and use minimal motion to suggest progress.</span>
            </li>
            <li className="mb-[4px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Replace skeletons immediately once the actual data is ready—do not leave them in place longer than necessary.</span>
            </li>
            <li className="mb-[4px] ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">Skeletons represent an indeterminate state. If a section takes unusually long (e.g. several seconds), consider switching to a fallback message or error state.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)] text-[#3c3c3c] text-[14px]">
              <span className="font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] not-italic">For web views,</span>
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">{` Web Content`}</span>
              <span className="leading-[20px]">{` is fully responsible for rendering and removing skeleton loaders. The `}</span>
              <span className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic">Web View container</span>
              <span className="leading-[20px]">{` does not provide native support for skeletons. Skeletons should be implemented within the web page, styled to match the rest of the interface, and only shown when truly necessary.`}</span>
            </li>
          </ul>
        </div>
      </div>
      <ProductMediaModal11 />
    </div>
  );
}

function Frame136() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame135() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[2]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame136 />
        </div>
      </div>
    </div>
  );
}

function Group() {
  return (
    <div className="absolute inset-[10.42%_27.23%_10.42%_27.65%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[-47px_-10px] mask-size-[170px_96px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
      <div className="absolute inset-[-1.11%_0_0_-0.96%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 77.4405 76.8435">
          <g id="Group">
            <path d={svgPaths.p2c708a80} fill="var(--fill-0, #F4F6F9)" id="Vector" />
            <path d={svgPaths.p1653e500} fill="var(--fill-0, #DBE7EE)" id="Vector_2" />
            <path d={svgPaths.pfab7a00} fill="var(--fill-0, #5B7D91)" id="Vector_3" opacity="0.3" />
            <path d={svgPaths.pef41c00} id="Vector_4" stroke="var(--stroke-0, #8CA9B7)" strokeWidth="0.982137" />
            <path d={svgPaths.p21ec2a40} id="Vector_5" stroke="var(--stroke-0, #8CA9B7)" strokeWidth="0.982137" />
            <path d="M22.8885 68.6303V69.6562" id="Vector_6" stroke="var(--stroke-0, #8CA9B7)" strokeWidth="0.982137" />
            <path d={svgPaths.p1db3d840} id="Vector_7" stroke="var(--stroke-0, #8CA9B7)" strokeWidth="0.982137" />
            <path d={svgPaths.p12303300} id="Vector_8" stroke="var(--stroke-0, #5B7D91)" strokeWidth="1.47321" />
            <path d={svgPaths.p22a6500} fill="var(--fill-0, #C5D4DC)" id="Vector_9" />
            <path d={svgPaths.p23237b80} fill="var(--fill-0, #DBE7EE)" id="Vector_10" />
            <path d={svgPaths.p26fe0900} id="Vector_11" stroke="var(--stroke-0, #5B7D91)" strokeWidth="0.982137" />
            <path d={svgPaths.p16366e00} fill="var(--fill-0, #5B7D91)" id="Vector_12" opacity="0.3" />
            <path d={svgPaths.p24b64000} fill="var(--fill-0, white)" id="Vector_13" />
            <path d={svgPaths.p37559900} fill="var(--fill-0, #CDDAE0)" id="Vector_14" />
            <path d={svgPaths.p221b9500} fill="var(--fill-0, #E9F0F5)" id="Vector_15" stroke="var(--stroke-0, #8CA9B7)" />
            <path d={svgPaths.p131ac900} fill="var(--fill-0, #DDE8EF)" id="Vector_16" />
            <path d={svgPaths.p387ef770} id="Vector_17" stroke="var(--stroke-0, #5B7D91)" strokeWidth="1.47321" />
            <path d={svgPaths.p24373300} id="Vector_18" stroke="var(--stroke-0, #486B80)" strokeWidth="2" />
            <path d={svgPaths.p237efdc0} id="Vector_19" stroke="var(--stroke-0, #486B80)" strokeWidth="2" />
            <path d={svgPaths.p356d480} fill="var(--fill-0, #486B80)" id="Vector_20" stroke="var(--stroke-0, #E9F0F5)" strokeWidth="0.982137" />
            <path d={svgPaths.p29588200} fill="var(--fill-0, #486B80)" id="Vector_21" />
            <path d={svgPaths.p10721c80} id="Vector_22" stroke="var(--stroke-0, #E9F0F5)" strokeWidth="0.982137" />
            <path d={svgPaths.p3df8da00} id="Vector_23" stroke="var(--stroke-0, #E9F0F5)" strokeWidth="0.982137" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function ClipPathGroup() {
  return (
    <div className="absolute contents inset-0" data-name="Clip path group">
      <Group />
    </div>
  );
}

function EmptyStateOfflineLightGray() {
  return (
    <div className="absolute contents inset-0" data-name="empty-state-offline-light-gray">
      <ClipPathGroup />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[96px] overflow-clip relative shrink-0 w-[170px]" data-name="empty-state">
      <EmptyStateOfflineLightGray />
    </div>
  );
}

function Frame138() {
  return (
    <div className="content-stretch flex flex-col items-start opacity-0 pt-[8px] relative shrink-0">
      <div className="bg-[rgba(0,0,0,0.15)] content-stretch flex items-center justify-center px-[12px] py-[2px] relative rounded-[60px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Retry</p>
        </div>
      </div>
    </div>
  );
}

function Frame137() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full">
      <EmptyState />
      <p className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[16px] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        No Connection
      </p>
      <div className="font-['Roboto:Regular',sans-serif] font-normal leading-[normal] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="mb-[2px]">{`Unable to display this content right now. `}</p>
        <p>Please check your connection and try again.</p>
      </div>
      <Frame138 />
    </div>
  );
}

function Caption3() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[30px] items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="Caption">
      <Frame137 />
    </div>
  );
}

function ProductMediaModal12() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[320px] isolate items-start overflow-clip relative rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] shrink-0 w-[480px]" data-name="Product Media Modal">
      <Frame135 />
      <Caption3 />
    </div>
  );
}

function Frame134() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] mb-0 text-[16px]">Offline</p>
          <p className="leading-[20px] mb-0 text-[14px]">If the device is offline or the web content cannot be reached, the Web View should display an offline state message. This could be an error screen within the content area that replaces the page.</p>
          <ul className="list-disc whitespace-pre-wrap">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Present a designed error state with icon or illustrations, title, and description. Indicate user “No Connection. Unable to display this content right now. Please check your connection and try again.”</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[#3c3c3c] text-[14px]">{`Detect offline status before launching the Web View when possible. `}</span>
            </li>
          </ul>
        </div>
      </div>
      <ProductMediaModal12 />
    </div>
  );
}

function Frame141() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame140() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[2]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame141 />
        </div>
      </div>
    </div>
  );
}

function EmptyStateSystemErrorLightGray() {
  return (
    <div className="absolute inset-[12.5%_22.25%_12.5%_22.35%]" data-name="empty-state-system-error-light-gray">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 94.1743 72.0008">
        <g id="empty-state-system-error-light-gray">
          <g id="spill">
            <path d={svgPaths.p2b0d2970} fill="var(--fill-0, #8CA9B7)" id="fill" />
            <path d={svgPaths.p14dd7200} fill="var(--fill-0, #5A7D91)" id="Shape" />
          </g>
          <path d={svgPaths.p3735f080} fill="var(--fill-0, #5A7D91)" id="cast-shadow" opacity="0.3" />
          <g id="cup-fills">
            <path d={svgPaths.p175c3e80} fill="var(--fill-0, white)" id="main-body" />
            <path d={svgPaths.p35d55f00} fill="var(--fill-0, #E7F0F5)" id="mid" />
            <g id="dark">
              <path d={svgPaths.p29759e00} fill="var(--fill-0, #CCD9E1)" id="Shape_2" />
              <path d={svgPaths.p8325880} fill="var(--fill-0, #CCD9E1)" id="Shape_3" />
              <path d={svgPaths.p134fd4c0} fill="var(--fill-0, #CCD9E1)" id="Shape_4" />
            </g>
          </g>
          <g id="cup-interior">
            <path d={svgPaths.p78ffc00} fill="var(--fill-0, #CCD9E1)" id="rim-fill" />
            <path d={svgPaths.p1a899980} fill="var(--fill-0, #B2C4D0)" id="interior-fill" />
            <path clipRule="evenodd" d={svgPaths.p1a899980} fillRule="evenodd" id="interior-outline" stroke="var(--stroke-0, #8CA9B8)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.66" />
            <path clipRule="evenodd" d={svgPaths.p78ffc00} fillRule="evenodd" id="rim-outline" stroke="var(--stroke-0, #8CA9B8)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.66" />
          </g>
          <g id="coffee-in-cup">
            <path d={svgPaths.p20de4c00} fill="var(--fill-0, #6F8EA0)" id="Shape_5" />
            <path d={svgPaths.p142ba800} fill="var(--fill-0, #6F8EA0)" id="Shape_6" />
            <path d={svgPaths.pd436a80} fill="var(--fill-0, #6F8EA0)" id="Shape_7" />
            <path clipRule="evenodd" d={svgPaths.p20de4c00} fillRule="evenodd" id="Shape_8" stroke="var(--stroke-0, #5A7D91)" strokeLinejoin="round" strokeWidth="0.66" />
            <path clipRule="evenodd" d={svgPaths.p142ba800} fillRule="evenodd" id="Shape_9" stroke="var(--stroke-0, #5A7D91)" strokeLinejoin="round" strokeWidth="0.66" />
            <path clipRule="evenodd" d={svgPaths.pd436a80} fillRule="evenodd" id="Shape_10" stroke="var(--stroke-0, #5A7D91)" strokeLinejoin="round" strokeWidth="0.66" />
          </g>
          <path d={svgPaths.p2b5b1100} fill="var(--fill-0, #5A7D91)" id="Shape_11" />
        </g>
      </svg>
    </div>
  );
}

function EmptyState1() {
  return (
    <div className="h-[96px] relative shrink-0 w-[170px]" data-name="empty-state">
      <EmptyStateSystemErrorLightGray />
    </div>
  );
}

function Frame143() {
  return (
    <div className="content-stretch flex flex-col items-start pt-[8px] relative shrink-0">
      <div className="bg-[rgba(0,0,0,0.15)] content-stretch flex items-center justify-center px-[12px] py-[2px] relative rounded-[60px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Retry</p>
        </div>
      </div>
    </div>
  );
}

function Frame142() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full">
      <EmptyState1 />
      <p className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[16px] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Oops... something went wrong
      </p>
      <div className="font-['Roboto:Regular',sans-serif] font-normal leading-[0] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[normal] mb-[2px]">{`We’re unable to content right now, please try again. `}</p>
        <p>
          <span className="leading-[normal]">{`If the problem persists, please `}</span>
          <span className="[text-decoration-skip-ink:none] decoration-solid leading-[normal] underline">contact us</span>
          <span className="leading-[normal]">{` for further assistance.`}</span>
        </p>
      </div>
      <Frame143 />
    </div>
  );
}

function Caption4() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[30px] items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="Caption">
      <Frame142 />
    </div>
  );
}

function ProductMediaModal13() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[320px] isolate items-start overflow-clip relative rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] shrink-0 w-[480px]" data-name="Product Media Modal">
      <Frame140 />
      <Caption4 />
    </div>
  );
}

function Frame139() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px] whitespace-pre-wrap">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] mb-0 text-[16px]">Load Failure</p>
          <p className="leading-[20px] mb-0 text-[14px]">{`Sometimes the server could be down or the content is taking too long to respond. If a certain time threshold passes (for example, ~30~60 seconds of no response), the Web View should transition from the loading state to  a load failure/ timeout error state. This can be presented similarly to the offline state`}</p>
          <ul className="list-disc">
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Present a designed error state with icon or illustrations, title, and description.</span>
            </li>
            <li className="mb-0 ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">If possible, differentiate error type and indicate the user. If we can’t get that granular, a general failure message is acceptable.</span>
            </li>
            <li className="ms-[calc(var(--list-marker-font-size,0)*1.5*1)]">
              <span className="leading-[20px] text-[14px]">Include corresponding CTA if applies.</span>
            </li>
          </ul>
        </div>
      </div>
      <ProductMediaModal13 />
    </div>
  );
}

function Frame146() {
  return (
    <div className="content-stretch flex items-center justify-end relative shrink-0 w-0">
      <div className="content-stretch flex gap-[2px] items-center justify-end p-[4px] relative rounded-[34px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#398ae7] text-[12px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Done</p>
        </div>
      </div>
    </div>
  );
}

function Frame145() {
  return (
    <div className="bg-white h-[40px] relative shrink-0 w-full z-[2]">
      <div aria-hidden="true" className="absolute border-[rgba(0,0,0,0.1)] border-b-[0.5px] border-solid inset-0 pointer-events-none" />
      <div className="flex flex-row items-center justify-end size-full">
        <div className="content-stretch flex items-center justify-end px-[18px] py-[12px] relative size-full">
          <p className="flex-[1_0_0] font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] min-h-px min-w-px relative text-[15px] text-[rgba(0,0,0,0.85)] text-center" style={{ fontVariationSettings: "'wdth' 100" }}>
            Title
          </p>
          <Frame146 />
        </div>
      </div>
    </div>
  );
}

function Group2() {
  return (
    <div className="absolute inset-[8.59%_37.95%_10.5%_0.78%]" data-name="Group">
      <div className="absolute inset-[-0.8%_-1.06%_-0.81%_-1.06%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 60.0645 78.9175">
          <g id="Group">
            <g id="Group_2">
              <path d={svgPaths.p12fa440} fill="var(--fill-0, white)" id="Vector" />
              <path d={svgPaths.p1ab11680} fill="var(--fill-0, #CDDAE0)" id="Vector_2" />
              <path d={svgPaths.pbba9700} fill="var(--fill-0, #CDDAE0)" id="Vector_3" />
              <path d={svgPaths.p2d3acf00} fill="var(--fill-0, #E8F0F5)" id="Vector_4" />
              <path d={svgPaths.p5a1db40} id="Vector_5" stroke="var(--stroke-0, #5B7E92)" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.25" />
            </g>
            <g id="Group_3">
              <path d={svgPaths.pbd38b72} fill="var(--fill-0, white)" id="Vector_6" />
              <path d={svgPaths.p2ef41c00} fill="var(--fill-0, #CDDAE0)" id="Vector_7" />
              <path d={svgPaths.p11980f00} fill="var(--fill-0, #CDDAE0)" id="Vector_8" />
              <path d={svgPaths.p283ec600} fill="var(--fill-0, #E8F0F5)" id="Vector_9" />
              <path d={svgPaths.p12cc3980} id="Vector_10" stroke="var(--stroke-0, #5B7E92)" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.25" />
            </g>
            <g id="Group_4">
              <path d={svgPaths.p459a480} fill="var(--fill-0, white)" id="Vector_11" />
              <path d={svgPaths.p30888900} fill="var(--fill-0, white)" id="Vector_12" />
              <path d={svgPaths.p24699200} fill="var(--fill-0, #E8F0F5)" id="Vector_13" />
            </g>
            <path d={svgPaths.p1db95d80} fill="var(--fill-0, #8CA6B4)" id="Vector_14" />
            <path d={svgPaths.p2b562d00} fill="var(--fill-0, #8CA6B4)" id="Vector_15" />
            <path d={svgPaths.p30181a80} fill="var(--fill-0, #8CA6B4)" id="Vector_16" />
            <path d={svgPaths.p6d1b880} fill="var(--fill-0, #8CA6B4)" id="Vector_17" />
            <path d={svgPaths.p3a6f4180} fill="var(--fill-0, #8CA6B4)" id="Vector_18" />
            <path d={svgPaths.p28af3100} fill="var(--fill-0, #8CA6B4)" id="Vector_19" />
            <path d={svgPaths.p33850f80} fill="var(--fill-0, #B0C4CD)" id="Vector_20" />
            <path d={svgPaths.p25730500} fill="var(--fill-0, #B0C4CD)" id="Vector_21" />
            <path d={svgPaths.p23d1d800} fill="var(--fill-0, #B0C4CD)" id="Vector_22" />
            <path d={svgPaths.p203b2e70} fill="var(--fill-0, #B0C4CD)" id="Vector_23" />
            <path d={svgPaths.p2bdfcc00} fill="var(--fill-0, #B0C4CD)" id="Vector_24" />
            <path d={svgPaths.p22f09e00} fill="var(--fill-0, #B0C4CD)" id="Vector_25" />
            <path d={svgPaths.p272a2400} fill="var(--fill-0, #A0B9C6)" id="Vector_26" />
            <path d={svgPaths.p122a4300} id="Vector_27" stroke="var(--stroke-0, #5B7E92)" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.25" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Group4() {
  return (
    <div className="absolute inset-[72.87%_40.06%_22.25%_59.94%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 0 4.68434">
        <g id="Group">
          <g id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group5() {
  return (
    <div className="absolute inset-[62.45%_30.24%_28.21%_67.59%]" data-name="Group">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.08193 8.96385">
        <g id="Group">
          <path d="M0 8.96385L2.08193 0Z" fill="var(--fill-0, #E6ECEF)" id="Vector" />
        </g>
      </svg>
    </div>
  );
}

function Group3() {
  return (
    <div className="absolute contents inset-[62.45%_30.24%_22.25%_59.94%]" data-name="Group">
      <Group4 />
      <Group5 />
    </div>
  );
}

function Group1() {
  return (
    <div className="absolute contents inset-[8.59%_30.24%_10.5%_0.78%]" data-name="Group">
      <Group2 />
      <Group3 />
    </div>
  );
}

function Group6() {
  return (
    <div className="absolute inset-[32.81%_-0.25%_11.2%_59.38%]" data-name="Group">
      <div className="absolute inset-[-1.16%_0_-1.16%_-1.59%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 39.8688 55.0007">
          <g id="Group">
            <path d={svgPaths.p33db1c80} fill="var(--fill-0, #5A7D91)" id="shadow 1" opacity="0.3" />
            <g id="Group_2">
              <path d={svgPaths.p2fe18c00} fill="var(--fill-0, #E6ECEF)" id="Vector" />
              <path d={svgPaths.p3bf40200} fill="var(--fill-0, white)" id="Vector_2" />
              <path d={svgPaths.p7bb8d80} fill="var(--fill-0, #C3D0D7)" id="Vector_3" />
              <path d={svgPaths.p38731b00} id="Vector_4" stroke="var(--stroke-0, #5A7D91)" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.25" />
            </g>
            <path d={svgPaths.p24038a00} fill="var(--fill-0, #5A7D91)" id="Vector_5" opacity="0.3" />
            <g id="Group_3">
              <path d={svgPaths.p3ff29200} fill="var(--fill-0, white)" id="Vector_6" />
              <path d={svgPaths.p14418400} fill="var(--fill-0, #E6ECEF)" id="Vector_7" />
              <path d={svgPaths.pc65de00} fill="var(--fill-0, #D1DCE2)" id="Vector_8" />
              <path d={svgPaths.p43dbe00} fill="var(--fill-0, #E6ECEF)" id="Vector_9" />
              <path d={svgPaths.p2fc1ba80} fill="var(--fill-0, #E6ECEF)" id="Vector_10" />
              <path d={svgPaths.p27ba4f80} fill="var(--fill-0, #D1DCE2)" id="Vector_11" />
              <path d={svgPaths.p34688b80} fill="var(--fill-0, #E6ECEF)" id="Vector_12" />
              <path d={svgPaths.p26d76100} fill="var(--fill-0, #B3C4CE)" id="Vector_13" />
              <path d={svgPaths.p34a9b300} fill="var(--fill-0, #C3D0D7)" id="Vector_14" />
              <path d={svgPaths.p32a1bf00} fill="var(--fill-0, #B3C4CE)" id="Vector_15" />
              <path d={svgPaths.p1f817e00} fill="var(--fill-0, #C3D0D7)" id="Vector_16" />
              <path d={svgPaths.p3cb03300} id="Vector_17" stroke="var(--stroke-0, #85A2B2)" strokeMiterlimit="10" strokeWidth="0.75" />
              <path d={svgPaths.p301ec200} id="Vector_18" stroke="var(--stroke-0, #85A2B2)" strokeMiterlimit="10" strokeWidth="0.75" />
              <path d={svgPaths.p3c6615c0} id="Vector_19" stroke="var(--stroke-0, #85A2B2)" strokeMiterlimit="10" strokeWidth="0.75" />
              <path d={svgPaths.p17612180} id="Vector_20" stroke="var(--stroke-0, #85A2B2)" strokeMiterlimit="10" strokeWidth="0.75" />
              <path d={svgPaths.p3ff29200} id="Vector_21" stroke="var(--stroke-0, #5A7D91)" strokeLinejoin="round" strokeMiterlimit="10" strokeWidth="1.25" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame148() {
  return (
    <div className="content-stretch flex flex-col items-start opacity-0 pt-[8px] relative shrink-0">
      <div className="bg-[rgba(0,0,0,0.15)] content-stretch flex items-center justify-center px-[12px] py-[2px] relative rounded-[60px] shrink-0" data-name="web/btn">
        <div className="flex flex-col font-['Roboto:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[12px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          <p className="leading-[16px]">Retry</p>
        </div>
      </div>
    </div>
  );
}

function Frame147() {
  return (
    <div className="content-stretch flex flex-col gap-[4px] items-center relative shrink-0 w-full">
      <div className="overflow-clip relative shrink-0 size-[96px]" data-name="Unable to Use">
        <div className="absolute inset-[54.38%_21.87%_10.02%_3.31%]" data-name="Vector">
          <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 71.8265 34.1783">
            <path d={svgPaths.p299cea80} fill="var(--fill-0, #5B7D91)" id="Vector" opacity="0.3" />
          </svg>
        </div>
        <Group1 />
        <Group6 />
      </div>
      <p className="font-['Roboto:SemiBold',sans-serif] font-semibold leading-[16px] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content]" style={{ fontVariationSettings: "'wdth' 100" }}>
        Service Temporarily Unavailable
      </p>
      <div className="font-['Roboto:Regular',sans-serif] font-normal leading-[normal] min-w-full overflow-hidden relative shrink-0 text-[10px] text-[rgba(0,0,0,0.25)] text-center text-ellipsis w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="mb-[2px]">{`We’re doing some works to improve your experience. `}</p>
        <p>Please check back 25 mins later.</p>
      </div>
      <Frame148 />
    </div>
  );
}

function Caption5() {
  return (
    <div className="content-stretch flex flex-[1_0_0] flex-col gap-[30px] items-center justify-center min-h-px min-w-px relative w-full z-[1]" data-name="Caption">
      <Frame147 />
    </div>
  );
}

function ProductMediaModal14() {
  return (
    <div className="bg-white content-stretch flex flex-col h-[320px] isolate items-start overflow-clip relative rounded-[8px] shadow-[0px_2px_3px_0px_rgba(0,0,0,0.08),0px_4px_12px_0px_rgba(0,0,0,0.14)] shrink-0 w-[480px]" data-name="Product Media Modal">
      <Frame145 />
      <Caption5 />
    </div>
  );
}

function Frame144() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[0] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] mb-0 text-[16px]">Scheduled Outage</p>
          <p className="leading-[20px] mb-[8px] text-[14px]">Sometimes the web service may intentionally go offline for updates or scheduled maintenance. In such cases, the Web View should display a dedicated maintenance message rather than a generic error screen. The goal is to clearly communicate that this downtime is temporary and expected — not a malfunction.</p>
          <p className="mb-[8px] text-[14px]">
            <span className="leading-[20px]">The message should include a friendly illustration or icon with text like “Service Temporarily Unavailable”, A secondary line can provide context like “</span>
            <span className="font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] not-italic">We’re doing some works to improve your experience</span>
            <span className="leading-[20px]">. Please check back later.”</span>
          </p>
          <p className="leading-[20px] text-[14px]">{`If the server provides a maintenance page with specific timing information, display that. Otherwise, fall back to a native maintenance screen within the container. `}</p>
        </div>
      </div>
      <ProductMediaModal14 />
    </div>
  );
}

function Frame149() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[0px]">
          <p className="font-['SF_Pro_Display:Bold',sans-serif] mb-0 text-[16px]">Recovery</p>
          <p className="text-[14px]">If the user hits Retry and the content loads successfully, the error message should be removed and replaced with the normal content. If they close the Web View from an error state, treat it as just a cancellation of that task (the app should still function normally). If multiple attempts fail, we might eventually advise them to try later or use a different approach (depending on criticality).</p>
        </div>
      </div>
    </div>
  );
}

function Body3() {
  return (
    <div className="content-stretch flex flex-col gap-[48px] items-start relative shrink-0 w-full" data-name="body">
      <Frame122 />
      <Frame126 />
      <Frame130 />
      <Frame134 />
      <Frame139 />
      <Frame144 />
      <Frame149 />
    </div>
  );
}

function WorkpsaceMenu6() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Workpsace Menu">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">States and Error Handling</p>
      </div>
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[14px]">
          <p className="mb-[8px]">Various conditions can interrupt or delay the display of web content. The Web View component must handle these gracefully and communicate clearly to the user using language, visuals, and behavior consistent with ArcSite’s design system.</p>
          <p>Unless the page is successfully loaded or a skeleton loader is actively presented by the web content itself, all other loading and error states—such as failure to connect—should be handled by the native Web View container. This ensures consistent framing, reliable fallback behavior, and a clear distinction between system-level issues and in-page delays.</p>
        </div>
      </div>
      <Body3 />
    </div>
  );
}

function Body4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="body">
      <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="Text">
        <div className="flex-[1_0_0] font-['SF_Pro_Display:Regular',sans-serif] leading-[20px] min-h-px min-w-px not-italic relative text-[#3c3c3c] text-[14px] whitespace-pre-wrap">
          <p className="mb-0">Designing the Web View with accessibility in mind is crucial to ensure all users, including those with disabilities, can use it effectively. The Web View combines native container elements and web content, so we must consider accessibility on both levels.</p>
          <p className="mb-0">&nbsp;</p>
          <p>Detail guide to be added later.</p>
        </div>
      </div>
    </div>
  );
}

function Principles2() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Principles">
      <div className="content-stretch flex flex-col items-start pt-[48px] relative shrink-0 w-[692px]" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[30px] not-italic relative shrink-0 text-[#3c3c3c] text-[24px] w-full">Accessibility</p>
      </div>
      <Body4 />
    </div>
  );
}

function Components2() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0" data-name="Components">
      <Components3 />
      <WorkpsaceMenu3 />
      <WorkpsaceMenu4 />
      <WorkpsaceMenu5 />
      <WorkpsaceMenu6 />
      <Principles2 />
    </div>
  );
}

function ToolbarPattern() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[96px] items-start left-[64px] right-[284px] top-[211px]" data-name="Toolbar Pattern">
      <Overview />
      <Components />
      <Components2 />
    </div>
  );
}

function Links() {
  return (
    <div className="content-stretch flex flex-col font-['SF_Pro_Display:Regular',sans-serif] items-start leading-[0] not-italic relative shrink-0 text-[#006eaf] text-[14px] text-left whitespace-nowrap" data-name="Links">
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Anatomy</p>
      </button>
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Usage</p>
      </button>
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Principles</p>
      </button>
    </div>
  );
}

function SectionA() {
  return (
    <div className="content-stretch cursor-pointer flex flex-col gap-[12px] items-start relative shrink-0" data-name="Section A">
      <button className="content-stretch flex flex-col items-start relative shrink-0" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3c3c3c] text-[14px] text-left whitespace-nowrap">Overview</p>
      </button>
      <Links />
    </div>
  );
}

function SubSections() {
  return (
    <div className="content-stretch cursor-pointer flex flex-col font-['SF_Pro_Display:Regular',sans-serif] items-start leading-[0] not-italic relative shrink-0 text-[#006eaf] text-[14px] text-left whitespace-nowrap" data-name="Sub sections">
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Layout</p>
      </button>
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Size and Position</p>
      </button>
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Style Variables</p>
      </button>
    </div>
  );
}

function Links1() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Links">
      <SubSections />
    </div>
  );
}

function SectionB() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-name="Section B">
      <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3c3c3c] text-[14px] text-left whitespace-nowrap">Components</p>
      </button>
      <Links1 />
    </div>
  );
}

function Links2() {
  return (
    <button className="content-stretch flex flex-col items-start relative shrink-0" data-name="Links">
      <p className="capitalize font-['SF_Pro_Display:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#006eaf] text-[14px] text-left whitespace-nowrap">{`Activating & Closing`}</p>
    </button>
  );
}

function Links3() {
  return (
    <div className="capitalize content-stretch flex flex-col font-['SF_Pro_Display:Regular',sans-serif] items-start leading-[0] not-italic relative shrink-0 text-[#006eaf] text-[14px] text-left whitespace-nowrap" data-name="Links">
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Gestures</p>
      </button>
      <button className="block relative shrink-0">
        <p className="leading-[24px]">Permission-Gated Interactions</p>
      </button>
      <button className="block relative shrink-0">
        <p className="leading-[24px]">{`States & Error Handling`}</p>
      </button>
    </div>
  );
}

function Frame150() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0">
      <Links2 />
      <Links3 />
    </div>
  );
}

function SectionD() {
  return (
    <div className="content-stretch cursor-pointer flex flex-col gap-[12px] items-start relative shrink-0" data-name="Section D">
      <button className="content-stretch flex flex-col items-start relative shrink-0" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3c3c3c] text-[14px] text-left whitespace-nowrap">Behaviors</p>
      </button>
      <Frame150 />
    </div>
  );
}

function Links4() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="Links">
      <p className="font-['SF_Pro_Display:Regular',sans-serif] leading-[24px] not-italic relative shrink-0 text-[#006eaf] text-[14px] whitespace-nowrap">TBA</p>
    </div>
  );
}

function SectionE() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0" data-name="Section E">
      <button className="content-stretch cursor-pointer flex flex-col items-start relative shrink-0" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[20px] not-italic relative shrink-0 text-[#3c3c3c] text-[14px] text-left whitespace-nowrap">Accessibility</p>
      </button>
      <Links4 />
    </div>
  );
}

function TableOfContent1() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-full" data-name="Table of Content">
      <SectionA />
      <SectionB />
      <SectionD />
      <SectionE />
    </div>
  );
}

function TableOfContent() {
  return (
    <div className="content-stretch flex flex-col gap-[24px] h-[554px] items-start pb-[24px] pointer-events-auto pt-[48px] px-[12px] sticky top-0 w-[228px]" data-name="Table of Content">
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="Subtitle">
        <p className="font-['SF_Pro_Display:Bold',sans-serif] leading-[26px] not-italic relative shrink-0 text-[#3c3c3c] text-[20px] w-full">Table of contents</p>
      </div>
      <TableOfContent1 />
    </div>
  );
}

export default function WebView() {
  return (
    <div className="bg-white relative size-full" data-name="Web View">
      <Header />
      <ToolbarPattern />
      <div className="absolute bottom-0 h-[16512px] left-[820px] pointer-events-none top-[211px]">
        <TableOfContent />
      </div>
    </div>
  );
}