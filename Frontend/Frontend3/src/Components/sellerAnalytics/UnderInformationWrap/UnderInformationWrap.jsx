import styles from "./UnderInformationWrap.module.scss"

const UnderInformationWrap = () => {

    const personalInformation = [
        {
            label: "Full Name",
            value: "Alexandra Thompson",
        },
        {
            label: "Date of Birth",
            value: "January 15, 1988",
        },
        {
            label: "Email",
            value: "alex.thompson@email.com",
        },
        {
            label: "Phone",
            value: "+1 (555) 123-4567",
            num: true
        },
    ]

    const businessInformation = [
        {
            label: "Business Name",
            value: "Thompson Design Studio LLC",
        },
        {
            label: "Business Type",
            value: "Limited Liability Company",
        },
        {
            label: "Tax ID",
            value: "**-***7890",
        },
        {
            label: "Registration Date",
            value: "March 10, 2020",
        },
    ]

    return (
        <div className={styles.main}>
            <div className={styles.block}>
                <h5>Personal Information</h5>
                {personalInformation.map((item) => (
                    <div className={styles.blockItem}>
                        <p>{item.label}</p>
                        <p style={{ fontFamily: item.num ? 'var(--ft)' : "" }}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className={styles.block}>
                <h5>Business Information</h5>
                {businessInformation.map((item) => (
                    <div className={styles.blockItem}>
                        <p>{item.label}</p>
                        <p style={{ fontFamily: item.num ? 'var(--ft)' : "" }}>{item.value}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default UnderInformationWrap