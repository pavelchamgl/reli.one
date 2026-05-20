import React from 'react';
import styles from './VerifiedBenefits.module.scss';


const VerifiedBenefitsList = () => {
    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Verified Seller Benefits</h2>

            <div className={styles.grid}>
                {/* Column 1: Data Protection */}
                <div className={styles.column}>
                    <div className={styles.iconWrapper}>
                        {/* Иконка Щита (Замени на свой SVG) */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 13C20 18 16.5 20.5 12.34 21.95C12.1222 22.0238 11.8855 22.0202 11.67 21.94C7.5 20.5 4 18 4 13V5.99996C4 5.73474 4.10536 5.48039 4.29289 5.29285C4.48043 5.10532 4.73478 4.99996 5 4.99996C7 4.99996 9.5 3.79996 11.24 2.27996C11.4519 2.09896 11.7214 1.99951 12 1.99951C12.2786 1.99951 12.5481 2.09896 12.76 2.27996C14.51 3.80996 17 4.99996 19 4.99996C19.2652 4.99996 19.5196 5.10532 19.7071 5.29285C19.8946 5.48039 20 5.73474 20 5.99996V13Z" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <h3 className={styles.columnTitle}>Data Protection:</h3>
                    <ul className={styles.list}>
                        <li>Your documents are used solely for seller verification</li>
                        <li>This information is not visible to buyers</li>
                        <li>Verification is required to access sales and payments</li>
                    </ul>
                </div>

                {/* Column 2: Verification Benefits */}
                <div className={styles.column}>
                    <div className={styles.iconWrapper}>
                        {/* Иконка Звезд/Блеска (Замени на свой SVG) */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9.93694 15.4998C9.84766 15.1537 9.66728 14.8379 9.41456 14.5851C9.16184 14.3324 8.84601 14.152 8.49994 14.0628L2.36494 12.4808C2.26027 12.4511 2.16815 12.388 2.10255 12.3012C2.03696 12.2144 2.00146 12.1086 2.00146 11.9998C2.00146 11.891 2.03696 11.7851 2.10255 11.6983C2.16815 11.6115 2.26027 11.5485 2.36494 11.5188L8.49994 9.93576C8.84589 9.84657 9.16163 9.66633 9.41434 9.4138C9.66705 9.16127 9.84751 8.84565 9.93694 8.49976L11.5189 2.36476C11.5483 2.25968 11.6113 2.1671 11.6983 2.10116C11.7852 2.03521 11.8913 1.99951 12.0004 1.99951C12.1096 1.99951 12.2157 2.03521 12.3026 2.10116C12.3896 2.1671 12.4525 2.25968 12.4819 2.36476L14.0629 8.49976C14.1522 8.84583 14.3326 9.16166 14.5853 9.41438C14.838 9.6671 15.1539 9.84748 15.4999 9.93676L21.6349 11.5178C21.7404 11.5469 21.8335 11.6098 21.8998 11.6968C21.9661 11.7839 22.002 11.8903 22.002 11.9998C22.002 12.1092 21.9661 12.2156 21.8998 12.3027C21.8335 12.3898 21.7404 12.4527 21.6349 12.4818L15.4999 14.0628C15.1539 14.152 14.838 14.3324 14.5853 14.5851C14.3326 14.8379 14.1522 15.1537 14.0629 15.4998L12.4809 21.6348C12.4515 21.7398 12.3886 21.8324 12.3016 21.8984C12.2147 21.9643 12.1086 22 11.9994 22C11.8903 22 11.7842 21.9643 11.6973 21.8984C11.6103 21.8324 11.5473 21.7398 11.5179 21.6348L9.93694 15.4998Z" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M20 3V7" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M22 5H18" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M4 17V19" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M5 18H3" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                    <h3 className={styles.columnTitle}>Verification Benefits:</h3>
                    <ul className={styles.list}>
                        <li>Activate your store</li>
                        <li>Enable payouts</li>
                        <li>Increase buyer trust</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const VerifiedBenefits = () => {
    const benefits = [
        {
            id: 'trust',
            title: 'Trust & Safety',
            description: 'Your verified badge builds customer confidence',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 13C20 18 16.5 20.5 12.34 21.95C12.1222 22.0238 11.8855 22.0202 11.67 21.94C7.5 20.5 4 18 4 13V5.99996C4 5.73474 4.10536 5.48039 4.29289 5.29285C4.48043 5.10532 4.73478 4.99996 5 4.99996C7 4.99996 9.5 3.79996 11.24 2.27996C11.4519 2.09896 11.7214 1.99951 12 1.99951C12.2786 1.99951 12.5481 2.09896 12.76 2.27996C14.51 3.80996 17 4.99996 19 4.99996C19.2652 4.99996 19.5196 5.10532 19.7071 5.29285C19.8946 5.48039 20 5.73474 20 5.99996V13Z" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            )
        },
        {
            id: 'support',
            title: 'Priority Support',
            description: 'Get faster response times from our support team',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.99999 14.0002C3.81076 14.0008 3.62522 13.9477 3.46495 13.8471C3.30467 13.7465 3.17623 13.6025 3.09454 13.4318C3.01286 13.2611 2.98129 13.0707 3.00349 12.8828C3.0257 12.6949 3.10077 12.5171 3.21999 12.3702L13.12 2.17016C13.1943 2.08444 13.2955 2.02652 13.407 2.0059C13.5185 1.98527 13.6337 2.00318 13.7337 2.05667C13.8337 2.11016 13.9126 2.19606 13.9573 2.30027C14.0021 2.40448 14.0101 2.52081 13.98 2.63016L12.06 8.65016C12.0034 8.80169 11.9844 8.96468 12.0046 9.12517C12.0248 9.28566 12.0837 9.43884 12.1761 9.57159C12.2685 9.70434 12.3918 9.81268 12.5353 9.88732C12.6788 9.96197 12.8382 10.0007 13 10.0002H20C20.1892 9.99952 20.3748 10.0526 20.535 10.1532C20.6953 10.2538 20.8238 10.3978 20.9054 10.5685C20.9871 10.7392 21.0187 10.9296 20.9965 11.1175C20.9743 11.3054 20.8992 11.4832 20.78 11.6302L10.88 21.8302C10.8057 21.9159 10.7045 21.9738 10.593 21.9944C10.4815 22.0151 10.3663 21.9972 10.2663 21.9437C10.1663 21.8902 10.0874 21.8043 10.0427 21.7001C9.99791 21.5958 9.98991 21.4795 10.02 21.3702L11.94 15.3502C11.9966 15.1986 12.0156 15.0356 11.9954 14.8752C11.9752 14.7147 11.9163 14.5615 11.8239 14.4287C11.7315 14.296 11.6082 14.1876 11.4647 14.113C11.3212 14.0384 11.1617 13.9996 11 14.0002H3.99999Z" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            )
        },
        {
            id: 'listings',
            title: 'Featured Listings',
            description: 'Eligible for premium placement in search results',
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.93694 15.4998C9.84766 15.1537 9.66728 14.8379 9.41456 14.5851C9.16184 14.3324 8.84601 14.152 8.49994 14.0628L2.36494 12.4808C2.26027 12.4511 2.16815 12.388 2.10255 12.3012C2.03696 12.2144 2.00146 12.1086 2.00146 11.9998C2.00146 11.891 2.03696 11.7851 2.10255 11.6983C2.16815 11.6115 2.26027 11.5485 2.36494 11.5188L8.49994 9.93576C8.84589 9.84657 9.16163 9.66633 9.41434 9.4138C9.66705 9.16127 9.84751 8.84565 9.93694 8.49976L11.5189 2.36476C11.5483 2.25968 11.6113 2.1671 11.6983 2.10116C11.7852 2.03521 11.8913 1.99951 12.0004 1.99951C12.1096 1.99951 12.2157 2.03521 12.3026 2.10116C12.3896 2.1671 12.4525 2.25968 12.4819 2.36476L14.0629 8.49976C14.1522 8.84583 14.3326 9.16166 14.5853 9.41438C14.838 9.6671 15.1539 9.84748 15.4999 9.93676L21.6349 11.5178C21.7404 11.5469 21.8335 11.6098 21.8998 11.6968C21.9661 11.7839 22.002 11.8903 22.002 11.9998C22.002 12.1092 21.9661 12.2156 21.8998 12.3027C21.8335 12.3898 21.7404 12.4527 21.6349 12.4818L15.4999 14.0628C15.1539 14.152 14.838 14.3324 14.5853 14.5851C14.3326 14.8379 14.1522 15.1537 14.0629 15.4998L12.4809 21.6348C12.4515 21.7398 12.3886 21.8324 12.3016 21.8984C12.2147 21.9643 12.1086 22 11.9994 22C11.8903 22 11.7842 21.9643 11.6973 21.8984C11.6103 21.8324 11.5473 21.7398 11.5179 21.6348L9.93694 15.4998Z" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M20 3V7" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M22 5H18" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M4 17V19" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <path d="M5 18H3" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            )
        }
    ];

    // return (
    //     <div className={styles.container}>
    //         <h2 className={styles.title}>Verified Seller Benefits</h2>
    //         <div className={styles.grid}>
    //             {benefits.map((benefit) => (
    //                 <div key={benefit.id} className={styles.card}>
    //                     <div className={styles.iconWrapper}>
    //                         {benefit.icon}
    //                     </div>
    //                     <h3 className={styles.cardTitle}>{benefit.title}</h3>
    //                     <p className={styles.cardDescription}>{benefit.description}</p>
    //                 </div>
    //             ))}
    //         </div>
    //     </div>
    // );

    return (
        <VerifiedBenefitsList />
    )
};

export default VerifiedBenefits;