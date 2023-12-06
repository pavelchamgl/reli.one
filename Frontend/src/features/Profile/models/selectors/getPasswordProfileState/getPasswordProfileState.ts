import { createSelector } from "@reduxjs/toolkit";

import { GlobalScheme } from "app/providers/Redux/models/types/ReduxType";
export const getPasswordProfileState = (state: GlobalScheme ) => state?.profilePassword