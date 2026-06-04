import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useActionSafeEmploed } from "../../hook/useActionSafeEmploed";

import { getAresCompanyByIco } from "../../api/seller/onboarding";
import {
    applyAresSelfEmployedPrefill,
    buildAresSelfEmployedPrefillPatch,
    formatAresAddress,
    getAresSelfEmployedRegistryName,
} from "../../features/seller-onboarding/applyAresSelfEmployedPrefill";

import styles from "../SellerCompanyInfo/SellerCompanyInfo.module.scss";

const getAresErrorKey = (err) => {
    if (err?.code === "ares_invalid_ico" || err?.status === 400) return "invalid";
    if (err?.code === "ares_not_found" || err?.status === 404) return "not_found";
    if (err?.code === "ares_unavailable" || err?.status === 503) return "unavailable";
    return "generic";
};

const SelfEmployedAresEntryAssistModal = ({ formik, onDismiss }) => {
    const { t } = useTranslation("onbording");
    const { safeData } = useActionSafeEmploed();
    const [ico, setIco] = useState(formik.values.ico || "");
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
        const appliedFields = applyAresSelfEmployedPrefill({ formik, aresPreview: preview });
        if (appliedFields.length > 0) {
            const patch = buildAresSelfEmployedPrefillPatch(preview);
            const safePatch = appliedFields.reduce((acc, field) => {
                acc[field] = patch[field];
                return acc;
            }, {});
            safeData(safePatch);
        }
        onDismiss("apply");
    };

    const handleManual = () => {
        onDismiss("manual");
    };

    const registryName = getAresSelfEmployedRegistryName(preview);

    return (
        <div className={styles.assistOverlay}>
            <div
                className={styles.assistModal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="self-employed-ares-entry-title"
                data-testid="self-employed-ares-entry-modal"
            >
                <div className={styles.assistHeader}>
                    <p className={styles.assistKicker}>{t("onboard.self_employed_ares.entry.kicker")}</p>
                    <h2 id="self-employed-ares-entry-title">{t("onboard.self_employed_ares.entry.title")}</h2>
                    <p>{t("onboard.self_employed_ares.entry.description")}</p>
                    <p className={styles.assistNote}>{t("onboard.self_employed_ares.entry.scope_note")}</p>
                </div>

                <div className={styles.assistLookup}>
                    <label htmlFor="self-employed-ares-entry-ico">{t("onboard.company.business_id")}</label>
                    <input
                        id="self-employed-ares-entry-ico"
                        name="self-employed-ares-entry-ico"
                        value={ico}
                        onChange={(event) => setIco(event.target.value)}
                        placeholder={t("onboard.self_employed_ares.entry.ico_placeholder")}
                        inputMode="numeric"
                    />
                </div>

                {errorKey &&
                    <p className={styles.assistError} role="alert">
                        {t(`onboard.self_employed_ares.errors.${errorKey}`)}
                    </p>}

                {preview &&
                    <div className={styles.assistPreview} data-testid="self-employed-ares-entry-preview">
                        <div className={styles.assistPreviewHeader}>
                            <p>{t("onboard.self_employed_ares.entry.preview_title")}</p>
                            {!preview.is_active &&
                                <span>{t("onboard.self_employed_ares.inactive_warning")}</span>}
                        </div>
                        <dl>
                            {registryName &&
                                <>
                                    <dt>{t("onboard.self_employed_ares.registry_name")}</dt>
                                    <dd>{registryName}</dd>
                                </>}
                            {(preview.business_id || preview.ico) &&
                                <>
                                    <dt>{t("onboard.company.business_id")}</dt>
                                    <dd>{preview.business_id || preview.ico}</dd>
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
                            ? t("onboard.self_employed_ares.loading")
                            : preview
                                ? t("onboard.self_employed_ares.entry.apply")
                                : t("onboard.self_employed_ares.entry.load")}
                    </button>
                    <button
                        type="button"
                        className={styles.assistSecondaryBtn}
                        onClick={handleManual}
                    >
                        {t("onboard.self_employed_ares.entry.manual")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelfEmployedAresEntryAssistModal;
