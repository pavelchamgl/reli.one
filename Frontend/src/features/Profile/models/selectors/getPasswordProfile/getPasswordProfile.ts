import { createSelector } from "@reduxjs/toolkit";
import { PasswordProfileSchema } from "../../passwordSlice/passwordSlice";
import { getPasswordProfileState } from "../getPasswordProfileState/getPasswordProfileState";

export const getPasswordProfile = createSelector(getPasswordProfileState, (state: PasswordProfileSchema) => state?.password)