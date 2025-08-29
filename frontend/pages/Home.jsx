
import React from "react";
import Frame1 from "../components/Home/Frame1";
import Frame2 from "../components/Home/Frame2";
import Frame3 from "../components/Home/Frame3";
import Frame4 from "../components/Home/Frame4";
import Frame5 from "../components/Home/Frame5";
import Frame6 from "../components/Home/Frame6"

const Home = () => {
  return (
    <div className="h-full min-h-screen w-full flex flex-col items-center justify-center">
      <Frame1 />
      <Frame2 />
      <Frame3 />
      <Frame4 />
      <Frame5 />
      <Frame6 />
    </div>
  );
};

export default Home;
