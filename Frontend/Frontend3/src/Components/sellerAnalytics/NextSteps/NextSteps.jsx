import React from 'react';
import styles from './NextSteps.module.scss';

const NextSteps = () => {
    const steps = [
        {
            id: 'availability',
            title: 'Set your availability',
            description: "Let customers know when you're available for work",
            buttonText: 'Set availability',
            // Сюда можно будет импортировать и вставить свой SVG компонент
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_7051_68489)">
                        <path d="M6.31641 1.6665V4.99984" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.9834 1.6665V4.99984" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15.4832 3.3335H3.81657C2.89609 3.3335 2.1499 4.07969 2.1499 5.00016V16.6668C2.1499 17.5873 2.89609 18.3335 3.81657 18.3335H15.4832C16.4037 18.3335 17.1499 17.5873 17.1499 16.6668V5.00016C17.1499 4.07969 16.4037 3.3335 15.4832 3.3335Z" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M2.1499 8.3335H17.1499" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                    <defs>
                        <clipPath id="clip0_7051_68489">
                            <rect width="20" height="20" fill="white" />
                        </clipPath>
                    </defs>
                </svg>
            )
        },
        {
            id: 'services',
            title: 'Add your services',
            description: 'Create service listings and set your pricing',
            buttonText: 'Add services',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.81657 18.1084C9.06993 18.2547 9.35734 18.3317 9.6499 18.3317C9.94246 18.3317 10.2299 18.2547 10.4832 18.1084L16.3166 14.7751C16.5697 14.6289 16.7799 14.4188 16.9262 14.1658C17.0724 13.9127 17.1496 13.6257 17.1499 13.3334V6.66675C17.1496 6.37448 17.0724 6.08742 16.9262 5.83438C16.7799 5.58134 16.5697 5.37122 16.3166 5.22508L10.4832 1.89175C10.2299 1.74547 9.94246 1.66846 9.6499 1.66846C9.35734 1.66846 9.06993 1.74547 8.81657 1.89175L2.98324 5.22508C2.73012 5.37122 2.51989 5.58134 2.37362 5.83438C2.22735 6.08742 2.1502 6.37448 2.1499 6.66675V13.3334C2.1502 13.6257 2.22735 13.9127 2.37362 14.1658C2.51989 14.4188 2.73012 14.6289 2.98324 14.7751L8.81657 18.1084Z" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9.6499 18.3333V10" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.3916 5.8335L9.64993 10.0002L16.9083 5.8335" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M5.8999 3.55811L13.3999 7.84977" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        },
        {
            id: 'dashboard',
            title: 'Explore your dashboard',
            description: 'Get familiar with your seller tools and analytics',
            buttonText: 'Go to dashboard',
            icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7.1499 2.5H2.98324C2.523 2.5 2.1499 2.8731 2.1499 3.33333V9.16667C2.1499 9.6269 2.523 10 2.98324 10H7.1499C7.61014 10 7.98324 9.6269 7.98324 9.16667V3.33333C7.98324 2.8731 7.61014 2.5 7.1499 2.5Z" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.3164 2.5H12.1497C11.6895 2.5 11.3164 2.8731 11.3164 3.33333V5.83333C11.3164 6.29357 11.6895 6.66667 12.1497 6.66667H16.3164C16.7766 6.66667 17.1497 6.29357 17.1497 5.83333V3.33333C17.1497 2.8731 16.7766 2.5 16.3164 2.5Z" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M16.3164 10H12.1497C11.6895 10 11.3164 10.3731 11.3164 10.8333V16.6667C11.3164 17.1269 11.6895 17.5 12.1497 17.5H16.3164C16.7766 17.5 17.1497 17.1269 17.1497 16.6667V10.8333C17.1497 10.3731 16.7766 10 16.3164 10Z" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7.1499 13.3335H2.98324C2.523 13.3335 2.1499 13.7066 2.1499 14.1668V16.6668C2.1499 17.1271 2.523 17.5002 2.98324 17.5002H7.1499C7.61014 17.5002 7.98324 17.1271 7.98324 16.6668V14.1668C7.98324 13.7066 7.61014 13.3335 7.1499 13.3335Z" stroke="#364153" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            )
        }
    ];

    return (
        <div className={styles.container}>
            <h2 className={styles.title}>Next Steps</h2>
            <div className={styles.list}>
                {steps.map((step) => (
                    <div key={step.id} className={styles.item}>
                        <div className={styles.contentLeft}>
                            <div className={styles.iconWrapper}>
                                {step.icon}
                            </div>
                            <div className={styles.textBlock}>
                                <h3 className={styles.itemTitle}>{step.title}</h3>
                                <p className={styles.itemDescription}>{step.description}</p>
                            </div>
                        </div>
                        <button className={styles.actionButton}>
                            {step.buttonText}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NextSteps;