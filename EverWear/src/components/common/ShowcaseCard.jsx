import styles from "../../style/Showcase.module.css";

export default function ShowcaseCard({ photo }) {
  return (
    <>
      <div className="flex h-[245px] w-[200px] shadow-[-13px_0px_4px_0px_rgba(0,0,0,0.25)] z-0 overflow-hidden items-center justify-center"
        style={{ height: "245px", width: "200px" }}>
        <div
          className="h-full w-full aspect-[3/2] "
          style={{
            backgroundImage: `
            url(${photo}),
            url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><filter id='noise'><feTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='4'/><feColorMatrix type='matrix' values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.7 0'/></filter><rect width='100' height='100' filter='url(%23noise)' fill='black'/></svg>")
          `,
            backgroundSize: "cover, auto",
            backgroundRepeat: "no-repeat, repeat",
            backgroundBlendMode: "overlay",
            filter: "brightness(1.5)",
          }}
          aria-label="showcase"
        />
      </div>
    </>
  );
}
