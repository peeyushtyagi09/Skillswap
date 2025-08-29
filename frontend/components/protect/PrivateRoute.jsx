import React,  { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
const Protect = () => {
    const navigate = useNavigate();
    useEffect(() => {
        if(!localStorage.getItem('accessToken')){
            navigate('/');
        }
    }, [navigate]);
    return <Outlet/>
}

export default Protect;