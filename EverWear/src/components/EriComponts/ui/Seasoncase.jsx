export default function Seasoncase({ title, subtitle, colors }) {
  return (
    <>
      <div className="flex relative w-full h-full justify-center sm:w-[450px] lg:w-[450px] lg:ml-[6rem] aspect-square">
        {/* 背景層 */}
        <div className="flex w-full h-full bg-linear-gradient shadow-xl z-0">
          <div className="z-10 flex gap-[5rem] items-center">
            {/* 內容層 */}
            <div className="inline-flex flex-col justify-start items-center scale-90 pt-[2rem] sm:pt-[2rem]">
              <img
                className="w-[12rem] object-contain"
                src="/src/assets/seasonModel.png"
              />
              <div className="text-h4 mt-[1rem] ml-5 sm:mr-[2.5rem] text-accent">
                {title} <br />
                {subtitle}
              </div>
            </div>

            <div className="color-palette z-10 inline-flex flex-col justify-center items-start gap-5 mr-[2rem]">
              {colors.map((color, index) => (
                <div
                  key={index}
                  className={`w-[5rem] h-[5rem] rounded-md ${color}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
