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
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714449/Qmd1M7FM9mMSxQXMRNfmitBjUZk4AFqBHsjkxrWu1c3xUq_dt3p7l.avif",
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714427/QmXR1Jrsk2c6F4HRr9XUtZJL2bxQCoH8iu35dGrWYDbnRv_xzmhgf.avif",
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714491/QmZSc8gYXn5zQ8Bu1S9ouaPLqzVkEJBVc5J2a2BkNp31t4_xfco2k.avif",
      ],
    },
    {
      text: "Learn fast through real connections",
      images: [
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714433/QmdA82UVcuJa2qYosG7q423ss7WUdLtQDkgy9DGTtg5GL1_rmkuni.avif",
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756714334/QmQfMXMq8EsPTbUiLKCHxuhSPKTzpdVMSYL5w9gNj9cAVF_hxumuf.avif",
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713347/image2_o2aiai.png",
      ],
    },
    {
      text: "Grow together, teach and inspire",
      images: [
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713339/image3_wnsfus.png",
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713338/image1_jfxrle.png",
        "https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713339/image5_sw43cl.png",
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