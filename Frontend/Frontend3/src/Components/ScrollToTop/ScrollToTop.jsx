import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
    const location = useLocation();
    const navigationType = useNavigationType();
    const prevPathRef = useRef(location.pathname);

    useEffect(() => {
        const pathChanged = prevPathRef.current !== location.pathname;

        if (pathChanged && navigationType !== "POP") {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

        prevPathRef.current = location.pathname;
    }, [location, navigationType]);

    return null;
}
