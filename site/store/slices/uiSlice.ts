import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  mobileMenuOpen: boolean;
  demoModalOpen: boolean;
  billingCycle: "monthly" | "yearly";
  activeFaq: number | null;
};

const initialState: UiState = {
  mobileMenuOpen: false,
  demoModalOpen: false,
  billingCycle: "yearly",
  activeFaq: 0,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setMobileMenu: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    openDemoModal: (state) => {
      state.demoModalOpen = true;
      state.mobileMenuOpen = false;
    },
    closeDemoModal: (state) => {
      state.demoModalOpen = false;
    },
    setBillingCycle: (
      state,
      action: PayloadAction<"monthly" | "yearly">,
    ) => {
      state.billingCycle = action.payload;
    },
    toggleFaq: (state, action: PayloadAction<number>) => {
      state.activeFaq =
        state.activeFaq === action.payload ? null : action.payload;
    },
  },
});

export const {
  setMobileMenu,
  openDemoModal,
  closeDemoModal,
  setBillingCycle,
  toggleFaq,
} = uiSlice.actions;
export default uiSlice.reducer;
