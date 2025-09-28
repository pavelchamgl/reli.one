import moln from "../../../assets/whyChoose/moln.svg"
import headPhone from "../../../assets/whyChoose/headphone.svg"
import dollar from "../../../assets/whyChoose/dollar.svg"
import shield from "../../../assets/whyChoose/shield.svg"
import graph from "../../../assets/whyChoose/graph.svg"
import users from "../../../assets/whyChoose/users.svg"
import Benefits from "../Benefits/Benefits"

import styles from "./OurBenefits.module.scss"




const OurBenefits = () => {

    const benefits = [
        {
            img: moln,
            postText: "Easy Сonditions",
            title: "Zero Effort for Manufacturers",
            desc: "No need to upload or manage products. Our team lists and optimizes everything for you.",
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #ffdf20 0%, #ffb86a 100%)"
            }
        },
        {
            img: headPhone,
            postText: "24/7 Available",
            title: "Personal Manager Support",
            desc: "Every seller has a dedicated manager who knows your business",
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #ffa2a2 0%, #ff6467 100%)"
            }
        },
        {
            img: dollar,
            postText: "100% Risk-Free",
            title: "Lowest Fees in the Market",
            desc: "keep more of your profits with our ultra-competitive commission rates",
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #7bf1a8 0%, #05df72 100%)"
            }
        },
        {
            img: shield,
            postText: "Guaranteed",
            title: "No Risk",
            desc: "No setup fees, no hidden charges. You only pay when you sell. ",
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #51a2ff 0%, #2b7fff 100%)"
            }
        },
        {
            img: graph,
            postText: "100%  Free",
            title: "Free Promotion",
            desc: "Your products can be featured in banners, promotions, and campaigns at no",
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #6584b9 0%, #325bae 100%)"
            }
        },
        {
            img: users,
            postText: "1K+ Products",
            title: " High-Quality Marketplace",
            desc: "We carefully select sellers and products to keep standards high.",
            style: {
                boxShadow: "0 1px 2px -1px rgba(0, 0, 0, 0.1), 0 1px 3px 0 rgba(0, 0, 0, 0.1)",
                background: "linear-gradient(90deg, #ffdf20 0%, #ffb86a 100%)"
            }
        },
    ]

    return (
        <div className={styles.main}>
            {benefits.map((item) => (
                <Benefits title={item.title} desc={item.desc} image={item.img} posText={item.postText} style={item.style} />
            ))}
        </div>
    )
}

export default OurBenefits