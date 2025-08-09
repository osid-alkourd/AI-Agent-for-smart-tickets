import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CheckAuth({ children, protectedRoute }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (protectedRoute) {
            if (!token) {
                navigate("/login");
            } else {
                setLoading(false);
            }
        } else {
            // unlogical step
            if (token) {
                navigate("/");
            } else {
                setLoading(false);
            }
        }
    }, [navigate, protectedRoute]);

    if (loading) {
        return <div>loading...</div>;
    }
    return children;
}

