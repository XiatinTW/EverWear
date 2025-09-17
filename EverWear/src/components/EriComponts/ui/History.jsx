import lineImg from "../../../assets/brandStory/line.png";
import factoryImg from "../../../assets/brandStory/factory.jpg";
import brandingImg from "../../../assets/brandStory/branding.png";
import artistImg from "../../../assets/brandStory/artist.png";
import transitionImg from "../../../assets/brandStory/transition.png";
import yearSwitch from "../../../assets/brandStory/year_switch.svg";

const imageMap = {
  line: lineImg,
  factory: factoryImg,
  branding: brandingImg,
  artist: artistImg,
  transition: transitionImg,
};
export default function History({ historyData }) {
  return (
    <>
      {historyData.map((item) => (
        <div
          key={item.id} // Use item.id instead of index
          className="absolute w-full h-full flex overflow-hidden"
        >
          <div className="story w-1/2 h-full flex items-end text-white p-[3rem] font-[text-shadow:_0px_2px_6px_rgb(0_0_0_/_0.00)]">
            {item.story}
          </div>
          <div className="year hidden absolute z-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 md:block">
            <p className="absolute z-30 text-h3 text-white top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              {item.year}
            </p>
            <img src={yearSwitch} alt="year-switch" className="md:scale-[1]" />
          </div>
          <div className="w-1/2 h-full">
            <img
              className="image w-full h-full object-cover"
              src={imageMap[item.image]}
              alt={item.image}
            />
          </div>
        </div>
      ))}
    </>
  );
}
