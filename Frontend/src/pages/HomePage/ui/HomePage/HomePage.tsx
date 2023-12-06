import { Intro } from 'widgets/Intro/ui/Intro'
import { Goods } from 'widgets/Goods/ui/Goods'
import { GoodsHome } from 'pages/HomePage/ui/GoodsHome/GoodsHome'
import {useEffect} from "react";

const HomePage: React.FC = () => {
    useEffect(() => {
        window.scroll(0,0)
    }, []);
    return (<>
        <div>
            <Intro/>
            <Goods/>
            <GoodsHome/>
        </div>
    </>)
}
export default HomePage
