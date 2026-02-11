import mainInstance from "..";

// =================================================
// ✅ General error handler
// =================================================
const handleError = (error, defaultMsg = "Unknown error") => {
    if (error.response) {
        const { status, data } = error.response;
        throw {
            status,
            message: data?.message || defaultMsg,
        };
    }
    if (error.request) {
        throw {
            status: null,
            message: "Server unavailable",
        };
    }
    throw {
        status: null,
        message: error.message || defaultMsg,
    };
};

// =================================================
// ✅ Seller Type
// =================================================
export const postSellerType = async (type) => {
    try {
        const res = await mainInstance.post("/sellers/onboarding/seller-type/", { seller_type: type });
        return res;
    } catch (error) {
        handleError(error, "Failed to select seller type");
    }
};

// =================================================
// ✅ Onboarding Status
// =================================================
export const getOnboardingStatus = async () => {
    try {
        const res = await mainInstance.get("/sellers/onboarding/state/");
        return res.data;
    } catch (error) {
        console.log(error);

        handleError(error, "Failed to fetch onboarding status");
    }
};

// =================================================
// ✅ Personal Data
// =================================================
export const putPersonalData = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/self-employed/personal/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save personal data");
    }
};

// =================================================
// ✅ Tax
// =================================================
export const putTax = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/self-employed/tax/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save tax information");
    }
};

// =================================================
// ✅ Self Address
// =================================================
export const putSelfAddress = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/self-employed/address/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save address");
    }
};

// =================================================
// ✅ Bank
// =================================================
export const putOnboardingBank = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/bank/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save bank information");
    }
};

// =================================================
// ✅ Warehouse
// =================================================
export const putWarehouse = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/warehouse/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save warehouse address");
    }
};

// =================================================
// ✅ Return Address
// =================================================
export const putReturnAddress = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/return/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save return address");
    }
};

// =================================================
// ✅ Review Onboarding
// =================================================
export const getReviewOnboarding = async () => {
    try {
        const res = await mainInstance.get("/sellers/onboarding/review/");
        return res.data;
    } catch (error) {
        handleError(error, "Failed to fetch review onboarding data");
    }
};

// =================================================
// ✅ Submit Onboarding
// =================================================
export const postSubmitOnboarding = async () => {
    try {
        const res = await mainInstance.post("/sellers/onboarding/submit/");
        return res.data;
    } catch (error) {
        throw (error)
        handleError(error, "Failed to submit onboarding data");
    }
};

// =================================================
// ✅ Company Info
// =================================================
export const putCompanyInfo = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/company/info/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save company info");
    }
};

// =================================================
// ✅ Representative
// =================================================
export const putRepresentative = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/company/representative/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save company representative data");
    }
};

// =================================================
// ✅ Company Address
// =================================================
export const putCompanyAddress = async (obj) => {
    try {
        const res = await mainInstance.put("/sellers/onboarding/company/address/", obj);
        return res.data;
    } catch (error) {
        handleError(error, "Failed to save company address");
    }
};

// =================================================
// ✅ Single Upload
// =================================================
export const uploadSingleDocument = async (doc) => {
    try {
        const { doc_type, scope, side, file } = doc;

        const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
        if (!allowedTypes.includes(file.type)) {
            throw { status: null, message: "Invalid file type. Only PDF, JPG, PNG are allowed" };
        }
        if (file.size > 10 * 1024 * 1024) {
            throw { status: null, message: "File must not exceed 10MB" };
        }

        const formData = new FormData();
        formData.append("doc_type", doc_type);
        formData.append("scope", scope);
        if (side) {
            formData.append("side", side);
        }
        formData.append("file", file);

        const res = await mainInstance.post("/sellers/onboarding/documents/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return res.data;
    } catch (error) {
        handleError(error, "Failed to upload document");
    }
};

// =================================================
// ✅ Batch Upload
// =================================================
export const uploadBatchDocuments = async (docs) => {
    try {
        const formData = new FormData();
        const documentsMeta = docs.map(({ doc_type, scope, side }) => ({ doc_type, scope, side }));
        formData.append("documents", JSON.stringify(documentsMeta));
        docs.forEach((doc) => formData.append("files", doc.file));

        const res = await mainInstance.post("/sellers/onboarding/documents/", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });

        return res.data;
    } catch (error) {
        handleError(error, "Failed to upload documents batch");
    }
};
