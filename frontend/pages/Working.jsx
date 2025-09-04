import React, {useState} from "react";

import { useNavigate} from 'react-router-dom';
import Dock from '../src/block/Dock/Dock';  
import Loader2 from "../components/Loaders/Loader2"


const Working = () => {
    
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

    const items = [
        { label: "Home", icon: ' 🏠 ', onClick: () => navigate("/landing") },
        { label: "Discuss", icon: '💬', onClick: () => navigate("/discuss") },
        { label: "Friends", icon: '👨', onClick: () => navigate("/friends") },
        {label: "Primium", icon: '🏆', onClick:() => navigate("/Working")}
      ];
      // when image finishes loading -> hide loader
  const handleImageLoad = () => {
    setLoading(false);
  };

  if (loading) return <Loader2 />;
  return (
    <div className="relative w-full h-screen">
      {/* Full width image from public folder */}
      <img
        src="https://res.cloudinary.com/djlcf4ix9/image/upload/v1756713344/working_fv6dia.pn" // put your image inside /public
        alt="Coming soon yes we are working "
        className="w-full h-full object-cover"
        onLoad={handleImageLoad}
      />

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-centern top-[-50vh] left-[30vw]"
      style={{
        fontFamily: '"Luckiest Guy", "Comic Sans MS", "Brush Script MT", cursive, sans-serif',
        fontWeight: 900,
        fontStyle: 'italic',
        fontSize: '5rem',
        letterSpacing: '0.03em',
        color: 'black',
        marginRight: '0.5em',
        textShadow: '0 1px 0 #000, 2px 0 #000',
      }}
      >
        <h1 className="text-5xl md:text-7xl font-bold text-white drop-shadow-lg text-center">
         Coming Soon
        </h1>
      </div>
      <Dock
        items={items}
        panelHeight={68}
        baseItemSize={50}
        magnification={70}
        spring={{ mass: 0.1, stiffness: 100, damping: 30 }}
        className=" fixed bottom-0 left-0 items-center justify-center bg-white/80 backdrop-blur-xl shadow-lg"
      />
    </div>
  );
};

export default Working;
