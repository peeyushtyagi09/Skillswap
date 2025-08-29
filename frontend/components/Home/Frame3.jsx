import React from "react";
import ScrollVelocity from "../../src/blocks/Animations/AnimatedContent/AnimatedContent";
import ThreeDHoverGallery from "../../src/components/lightswind/3d-hover-gallery";

// ✅ Reusable gallery
const ThreeDGallery = ({ images }) => {
  return (
    <ThreeDHoverGallery
      images={images}
      activeWidth={40}
      hoverScale={12}
      perspective={60}
    />
  );
};

const Frame3 = () => {
  const baseVelocity = 70;

  const textStyle = {
    fontSize: "14vw",
    lineHeight: "0.85",
    fontWeight: "bold",
    letterSpacing: "-0.04em",
  };

  // ✅ Each text with its own gallery images
  const content = [
    {
      text: "Swap skills, unlock new opportunities",
      images: [
        "/src/public/images/image1.png",
        "/src/public/images/image2.png",
        "/src/public/images/image3.png",
      ],
    },
    {
      text: "Learn fast through real connections",
      images: [
        "/src/public/images/image4.png",
        "/src/public/images/image5.png",
        "/src/public/images/image1.png",
      ],
    },
    {
      text: "Grow together, teach and inspire",
      images: [
        "/src/public/images/image1.png",
        "/src/public/images/image3.png",
        "/src/public/images/image5.png",
      ],
    },
  ];

  return (
    <div className="bg-[#f5f2f2] w-full min-h-screen flex flex-col items-center justify-center p-0 space-y-12">
      {content.map((item, idx) => (
        <div
          key={idx}
          className="relative group w-full flex items-center justify-center overflow-hidden"
        >
          {/* Scrolling text */}
          <ScrollVelocity
            texts={[item.text]}
            velocity={idx % 2 === 0 ? baseVelocity : -baseVelocity}
            className="custom-scroll-text"
            scrollerStyle={textStyle}
          />

          {/* Gallery appears exactly in middle of the text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 pointer-events-auto">
            <ThreeDGallery images={item.images} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Frame3;