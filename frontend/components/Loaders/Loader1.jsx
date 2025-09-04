import React, { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useLocation } from 'react-router-dom'
const Loader1 = (props) => {

    const currentPath = useLocation().pathname

    const stairParent = useRef(null)
    const pageRef = useRef(null)

    useGSAP(function() {
        const tl = gsap.timeline()
        tl.to(stairParent.current, {
        display:'block'
        })

        tl.from('.stair-1', {
        height: 0,
        stagger:{
            amount:-0.25
        }
        })
        tl.to('.stair-1', {
        y: '100%',
        stagger:{
            amount:0.25
        }
        })
        tl.to(stairParent.current, {
        display:'none'
        })
        tl.to('.stair-1', {
        y: '0%', 
        })
        gsap.from(pageRef.current, {
            opacity:0,
            delay:2,
            scale: 1.2,
        })
    }, [currentPath])
  return (
    <div>
        <div ref={stairParent} className='h-screen w-full  fixed z-20 top-0 '>
        <div className='h-screen w-full flex overflow-hidden'>
            <div className=' stair-1 h-full w-1/5 bg-black'></div>
            <div className=' stair-1 h-full w-1/5 bg-black'></div>
            <div className=' stair-1 h-full w-1/5 bg-black'></div>
            <div className=' stair-1 h-full w-1/5 bg-black'></div>
            <div className=' stair-1 h-full w-1/5 bg-black'></div>
        </div>
      </div>
        <div ref={pageRef}>
            {props.children}
        </div>
    </div>
  )
}

export default Loader1
