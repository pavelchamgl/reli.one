import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

import addressIc from "../../../../../assets/Seller/register/addressIc.svg"
import { countriesArr } from "../../../../../code/seller";
import EditBtn from "../../../../../ui/Seller/review/EditBtn/EditBtn"
import PrevDocBtn from "../../../newOrder/prevDocBtn/PrevDocBtn";

import styles from "./BusinessAddress.module.scss"

const BusinessAddress = ({ data, setOpen, isCompany }) => {

    const { pathname } = useLocation()
    const { selfData, companyData } = useSelector(state => state.selfEmploed)

    const country = countriesArr.find((item) => item.value === data?.country)

    const storeData = isCompany ? companyData : selfData

    const addressName = isCompany
        ? storeData?.company_address_name
        : storeData?.self_address_name;


    return (
        <div className={styles.main}>
            <div className={styles.titleWrap}>
                <div>
                    <img src={addressIc} alt="" />
                    <h3>{pathname === "/seller/seller-review" ? "Address" : "Business Address"}</h3>
                </div>

                <EditBtn setOpen={setOpen} />
            </div>

            <ul className={styles.infoList}>
                <li>
                    <p>Street</p>
                    <span>{`${data?.street}`}</span>
                </li>
                <li>
                    <p>City</p>
                    <span>{`${data?.city}`}</span>
                </li>
                <li>
                    <p>ZIP</p>
                    <span>{`${data?.zip_code}`}</span>
                </li>
                <li>
                    <p>Country</p>
                    <span>{`${country?.text}`}</span>
                </li>
            </ul>


            {addressName && (
                <div>
                    <p className={styles.docTitle}>Proof of address</p>
                    <PrevDocBtn setOpen={setOpen} text={addressName} />
                </div>
            )}



        </div>
    )
}

export default BusinessAddress