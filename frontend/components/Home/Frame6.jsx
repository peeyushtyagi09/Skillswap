import React, { useEffect } from 'react'
import TextPressure from '../../src/TextAnimations/TextPressure/TextPressure'  

const Frame6 = () => {

  return (
    <div className="p-10 w-full h-fit flex items-center justify-center bg-[#f5f2f2] rounded-box shadow-lg">
      <div className="w-full h-full flex items-center justify-center"
      
      >
        
        <TextPressure
        
          text="SKILLSWAP"
          flex={true} 
          width={true}
          weight={true}
          italic={true}
          textColor="black"
          strokeColor="black" 
          minFontSize={48}
          className="w-full h-full"
        />
      </div>
    </div>
  )
}

export default Frame6
