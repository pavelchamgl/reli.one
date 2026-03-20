import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import { getBankData, getCompanyAddress, getCompanyInfo, getDocumentsData, getPersonalData, getRepresentativeData, getReturnData, getSelfAddressData, getTaxData, getWarehouseData } from "../api/seller/getOnboardingData"


export const getAllDataFromBD = createAsyncThunk(
    'selfEmploed/getAllDataFromBD',
    async (_, { }) => {
        const results = await Promise.allSettled([
            getPersonalData(),
            getTaxData(),
            getSelfAddressData(),
            getBankData(),
            getWarehouseData(),
            getReturnData(),
            getDocumentsData()
        ])

        const dataArr = results.map((item) => item.value)





        const errors = results
            .filter((r) => r.status === "rejected")
            .map((r) => r.reason);

        if (errors.length) {
            console.log(errors);

        }

        return dataArr


    }
)

export const getAllCompanyDataBD = createAsyncThunk(
    'selfEmploed/getAllCompanyDataBD',
    async (_, { }) => {
        const results = await Promise.allSettled([
            getCompanyInfo(),
            getRepresentativeData(),
            getCompanyAddress(),
            getBankData(),
            getWarehouseData(),
            getReturnData(),
            getDocumentsData()
        ])

        const dataArr = results.map((item) => item.value)





        const errors = results
            .filter((r) => r.status === "rejected")
            .map((r) => r.reason);

        if (errors.length) {
            console.log(errors);

        }

        return dataArr


    }
)

const selfEmploedSlice = createSlice({
    name: "selfEmploed",
    initialState: {
        selfData: {

        },
        selfDataLoading: false,
        companyData: {

        },
        companyDataLoading: false,

        registerData: {

        }
    },
    reducers: {
        safeData: (state, action) => {
            state.selfData = {
                ...state.selfData, ...action.payload
            }
        },
        safeCompanyData: (state, action) => {
            console.log(action.payload);

            state.companyData = {
                ...state.companyData, ...action.payload
            }
        },
        setRegisterData: (state, action) => {
            state.registerData = {
                ...state.registerData,
                ...action.payload
            }
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getAllDataFromBD.pending, (state, action) => {
            state.selfDataLoading = true
        })
        builder.addCase(getAllDataFromBD.fulfilled, (state, action) => {
            state.selfDataLoading = false
            const [personal, tax, selfAddress, bank, warehouse, returnAddress, documents] = action.payload

            console.log(documents);


            if (documents.length === 0) {
                state.selfData.uploadFront = ''
                state.selfData.uploadBack = ''
                state.selfData.front = ''
                state.selfData.back = ''
                state.selfData.proof_document_issue_date = ''
                state.selfData.self_address_name = ''
                state.selfData.wProof_document_issue_date = ''
                state.selfData.warehouse_name = ''
            } else {
                const backDocument = documents?.find((item) => item?.side === 'back' && item?.doc_type === 'identity_document')
                const frontDocument = documents?.find((item) => item?.side === 'front' && item?.doc_type === 'identity_document')
                const selfAddressDoc = documents?.find((item) => item?.scope === 'self_employed_address' && item?.doc_type === 'proof_of_address')
                const warehouseDoc = documents?.find((item) => item?.scope === 'warehouse_address' && item?.doc_type === 'proof_of_address')

                console.log(backDocument, frontDocument, selfAddressDoc, warehouseDoc);



                if (backDocument) {
                    state.selfData.uploadBack = backDocument.uploaded_at
                    state.selfData.back = state.selfData?.back ?? 'back side is upload at'
                } else {
                    state.selfData.uploadBack = ''
                    state.selfData.back = ''
                }

                if (frontDocument) {
                    state.selfData.uploadFront = frontDocument.uploaded_at
                    state.selfData.front = state.selfData?.front ?? 'front side is upload at'
                } else {
                    state.selfData.uploadFront = ''
                    state.selfData.front = ''
                }

                if (selfAddressDoc) {
                    state.selfData.proof_document_issue_date = selfAddressDoc.uploaded_at
                    state.selfData.self_address_name = state.selfData.self_address_name ?? 'self_employed_address is upload at'
                } else {
                    state.selfData.proof_document_issue_date = ''
                    state.selfData.self_address_name = ''
                }


                if (warehouseDoc) {

                    state.selfData.wProof_document_issue_date = warehouseDoc.uploaded_at
                    state.selfData.warehouse_name = state.selfData.warehouse_name ?? 'warehouse_address is upload at'
                } else {
                    state.selfData.wProof_document_issue_date = ''
                    state.selfData.warehouse_name = ''
                }
            }



            state.selfData.wStreet = warehouse?.street ?? ''
            state.selfData.wCity = warehouse?.city ?? ''
            state.selfData.wZip_code = warehouse?.zip_code ?? ''
            state.selfData.wCountry = warehouse?.country ?? ''
            state.selfData.contact_phone = warehouse?.contact_phone


            state.selfData.same_as_warehouse = returnAddress?.same_as_warehouse ?? ''
            state.selfData.rStreet = returnAddress?.street ?? ''
            state.selfData.rCity = returnAddress?.city ?? ''
            state.selfData.rZip_code = returnAddress?.zip_code ?? ''
            state.selfData.rCountry = returnAddress?.country ?? ''
            state.selfData.rContact_phone = returnAddress?.contact_phone ?? ''


            state.selfData = {
                ...state.selfData,
                ...selfAddress,
                ...bank,
                ...tax,
                ...personal,
            }

        })

        builder.addCase(getAllCompanyDataBD.pending, (state, action) => {
            state.companyDataLoading = true
        })

        builder.addCase(getAllCompanyDataBD.fulfilled, (state, action) => {
            state.companyDataLoading = false
            const [companyInfo, representative, companyAddress, bank, warehouse, returnAddress, documents] = action.payload



            if (documents && documents.length === 0) {
                state.selfData.uploadFront = ''
                state.selfData.uploadBack = ''
                state.selfData.front = ''
                state.selfData.back = ''
                state.selfData.proof_document_issue_date = ''
                state.selfData.self_address_name = ''
                state.selfData.wProof_document_issue_date = ''
                state.selfData.warehouse_name = ''
            } else {
                const backDocument = documents?.find((item) => item?.side === 'back' && item?.doc_type === 'identity_document')
                const frontDocument = documents?.find((item) => item?.side === 'front' && item?.doc_type === 'identity_document')
                const companyAddressDoc = documents?.find((item) => item?.scope === 'company_address' && item?.doc_type === 'proof_of_address')
                const warehouseDoc = documents?.find((item) => item?.scope === 'warehouse_address' && item?.doc_type === 'proof_of_address')
                const certifikate = documents?.find((item) => item?.scope === 'company_info' && item?.doc_type === 'registration_certificate')

                if (backDocument) {
                    state.companyData.uploadBack = backDocument.uploaded_at
                    state.companyData.back = state.companyData?.back ?? 'back side is upload at'
                } else {
                    state.companyData.uploadBack = ''
                    state.companyData.back = ''
                }

                if (frontDocument) {
                    state.companyData.uploadFront = frontDocument.uploaded_at
                    state.companyData.front = state.companyData?.front ?? 'front side is upload at'
                } else {
                    state.companyData.uploadFront = ''
                    state.companyData.front = ''
                }

                if (certifikate) {
                    state.companyData.company_file_date = state.companyData.company_file_date ?? 'registration_certificate upload at'
                    state.companyData.certificate_issue_date = certifikate.uploaded_at
                } else {
                    state.companyData.company_file_date = ''
                    state.companyData.certificate_issue_date = ''
                }

                if (companyAddressDoc) {
                    state.companyData.proof_document_issue_date = companyAddressDoc.uploaded_at
                    state.companyData.company_address_name = state.companyData.company_address_name ?? 'company_address is upload at'
                } else {
                    state.companyData.proof_document_issue_date = ''
                    state.companyData.company_address_name = ''
                }


                if (warehouseDoc) {
                    state.companyData.wProof_document_issue_date = warehouseDoc.uploaded_at
                    state.companyData.warehouse_name = state.companyData.warehouse_name ?? 'warehouse_address is upload at'
                } else {
                    state.companyData.wProof_document_issue_date = ''
                    state.companyData.warehouse_name = ''
                }
            }

            state.companyData.wStreet = warehouse?.street ?? ''
            state.companyData.wCity = warehouse?.city ?? ''
            state.companyData.wZip_code = warehouse?.zip_code ?? ''
            state.companyData.wCountry = warehouse?.country ?? ''
            state.companyData.contact_phone = warehouse?.contact_phone


            state.companyData.same_as_warehouse = returnAddress?.same_as_warehouse ?? ''
            state.companyData.rStreet = returnAddress?.street ?? ''
            state.companyData.rCity = returnAddress?.city ?? ''
            state.companyData.rZip_code = returnAddress?.zip_code ?? ''
            state.companyData.rCountry = returnAddress?.country ?? ''
            state.companyData.rContact_phone = returnAddress?.contact_phone ?? ''


            state.companyData = {
                ...state.companyData,
                ...companyInfo,
                ...representative,
                ...companyAddress,
                ...bank
            }
        })
    }
})

export const { safeData, safeCompanyData, setRegisterData } = selfEmploedSlice.actions
export const { reducer } = selfEmploedSlice