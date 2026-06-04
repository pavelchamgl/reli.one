import { useState } from "react";
import { useTranslation } from "react-i18next";

import { getAresCompanyByIco } from "../../api/seller/onboarding";
import { applyAresCompanyPrefill, formatAresAddress } from "../../features/seller-onboarding/applyAresCompanyPrefill";

import styles from "./SellerCompanyInfo.module.scss";

const getAresErrorKey = (err) => {
    if (err?.code === "ares_invalid_ico" || err?.status === 400) return "invalid";
    if (err?.code === "ares_not_found" || err?.status === 404) return "not_found";
    if (err?.code === "ares_unavailable" || err?.status === 503) return "unavailable";
    return "generic";
};

const CompanyAresEntryAssistModal = ({ formik, onDismiss }) => {
    const { t } = useTranslation("onbording");
    const [ico, setIco] = useState(formik.values.business_id || "");
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [errorKey, setErrorKey] = useState("");

    const handleLookup = async () => {
        setLoading(true);
        setPreview(null);
        setErrorKey("");

        try {
            const result = await getAresCompanyByIco(ico);
            if (!result?.found) {
                setErrorKey(result?.code === "ares_invalid_ico" ? "invalid" : "not_found");
                return;
            }
            setPreview(result);
        } catch (err) {
            setErrorKey(getAresErrorKey(err));
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!preview) return;
        applyAresCompanyPrefill({ formik, aresPreview: preview });
        onDismiss("apply");
    };

    const handleManual = () => {
        onDismiss("manual");
    };

    return (
        <div className={styles.assistOverlay}>
            <div
                className={styles.assistModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="company-ares-entry-title"
                data-testid="company-ares-entry-modal"
            >
                <div className={styles.assistHeader}>
                    <p className={styles.assistKicker}>{t("onboard.company.ares_entry.kicker")}</p>
                    <h2 id="company-ares-entry-title">{t("onboard.company.ares_entry.title")}</h2>
                    <p>{t("onboard.company.ares_entry.description")}</p>
                    <p className={styles.assistNote}>{t("onboard.company.ares_entry.scope_note")}</p>
                </div>

                <div className={styles.assistLookup}>
                    <label htmlFor="company-ares-entry-ico">{t("onboard.company.business_id")}</label>
                    <input
                        id="company-ares-entry-ico"
                        name="company-ares-entry-ico"
                        value={ico}
                        onChange={(event) => setIco(event.target.value)}
                        placeholder={t("onboard.company.ares_entry.ico_placeholder")}
                        inputMode="numeric"
                    />
                </div>

                {errorKey &&
                    <p className={styles.assistError} role="alert">
                        {t(`onboard.company.ares.errors.${errorKey}`)}
                    </p>}

                {preview &&
                    <div className={styles.assistPreview} data-testid="company-ares-entry-preview">
                        <div className={styles.assistPreviewHeader}>
                            <p>{t("onboard.company.ares_entry.preview_title")}</p>
                            {!preview.is_active &&
                                <span>{t("onboard.company.ares.inactive_warning")}</span>}
                        </div>
                        <dl>
                            {preview.company_name &&
                                <>
                                    <dt>{t("onboard.company.name")}</dt>
                                    <dd>{preview.company_name}</dd>
                                </>}
                            {(preview.business_id || preview.ico) &&
                                <>
                                    <dt>{t("onboard.company.business_id")}</dt>
                                    <dd>{preview.business_id || preview.ico}</dd>
                                </>}
                            {preview.legal_form &&
                                <>
                                    <dt>{t("onboard.company.legal_form")}</dt>
                                    <dd>{preview.legal_form}</dd>
                                </>}
                            {formatAresAddress(preview.registered_address) &&
                                <>
                                    <dt>{t("onboard.company.ares.registered_address")}</dt>
                                    <dd>{formatAresAddress(preview.registered_address)}</dd>
                                </>}
                            {preview.dic_hint &&
                                <>
                                    <dt>{t("onboard.company.ares.dic_hint")}</dt>
                                    <dd>{preview.dic_hint}</dd>
                                </>}
                        </dl>
                    </div>}

                <div className={styles.assistActions}>
                    <button
                        type="button"
                        className={styles.assistPrimaryBtn}
                        onClick={preview ? handleApply : handleLookup}
                        disabled={loading}
                    >
                        {loading
                            ? t("onboard.company.ares.loading")
                            : preview
                                ? t("onboard.company.ares_entry.apply")
                                : t("onboard.company.ares_entry.load")}
                    </button>
                    <button
                        type="button"
                        className={styles.assistSecondaryBtn}
                        onClick={handleManual}
                    >
                        {t("onboard.company.ares_entry.manual")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanyAresEntryAssistModal;
