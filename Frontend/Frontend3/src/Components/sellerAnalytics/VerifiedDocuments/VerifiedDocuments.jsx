import React, { useState } from 'react';
import styles from './VerifiedDocuments.module.scss';

const VerifiedDocuments = () => {
    const [isOpen, setIsOpen] = useState(false);

    const docs = [
        { id: 'id', name: 'Government-issued ID', date: 'Verified on Mar 18, 2026' },
        { id: 'license', name: 'Business License', date: 'Verified on Mar 18, 2026' },
        { id: 'bank', name: 'Bank Statement', date: 'Verified on Mar 18, 2026' },
        { id: 'tax', name: 'Tax Certificate', date: 'Verified on Mar 18, 2026' },
    ];

    return (
        <div className={styles.container}>
            <div
                className={styles.header}
                onClick={() => setIsOpen(!isOpen)}
                role="button"
                tabIndex={0}
            >
                <h2 className={styles.title}>Verified Documents</h2>
                <div className={styles.toggleBtn}>
                    <span>{isOpen ? 'Hide documents' : 'View documents'}</span>
                    <svg
                        className={`${styles.arrow} ${isOpen ? styles.arrowRotated : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className={styles.body}>
                    {docs.map((doc) => (
                        <div key={doc.id} className={styles.docRow}>
                            <div className={styles.leftInfo}>
                                <div className={styles.fileIcon}>
                                    {/* Иконка файла */}
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12.1501 1.6665H4.65007C4.20804 1.6665 3.78411 1.8421 3.47155 2.15466C3.15899 2.46722 2.9834 2.89114 2.9834 3.33317V16.6665C2.9834 17.1085 3.15899 17.5325 3.47155 17.845C3.78411 18.1576 4.20804 18.3332 4.65007 18.3332H14.6501C15.0921 18.3332 15.516 18.1576 15.8286 17.845C16.1411 17.5325 16.3167 17.1085 16.3167 16.6665V5.83317L12.1501 1.6665Z" stroke="#00A63E" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M11.3164 1.6665V4.99984C11.3164 5.44186 11.492 5.86579 11.8046 6.17835C12.1171 6.49091 12.541 6.6665 12.9831 6.6665H16.3164" stroke="#00A63E" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M7.1499 12.5002L8.81657 14.1668L12.1499 10.8335" stroke="#00A63E" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                                <div>
                                    <div className={styles.docName}>{doc.name}</div>
                                    <div className={styles.docDate}>{doc.date}</div>
                                </div>
                            </div>
                            <div className={styles.statusBadge}>
                                Verified
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VerifiedDocuments;