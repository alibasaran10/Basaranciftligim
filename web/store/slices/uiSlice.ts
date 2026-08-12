import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ModalKind = "quick" | "add" | "filters" | null;

type UiState = {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  modal: ModalKind;
  toast: string | null;
  search: string;
};

const initialState: UiState = {
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  modal: null,
  toast: null,
  search: "",
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setMobileMenu: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<Exclude<ModalKind, null>>) => {
      state.modal = action.payload;
      state.mobileMenuOpen = false;
    },
    closeModal: (state) => {
      state.modal = null;
    },
    showToast: (state, action: PayloadAction<string>) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    },
    setSearch: (state, action: PayloadAction<string>) => {
      state.search = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setMobileMenu,
  openModal,
  closeModal,
  showToast,
  clearToast,
  setSearch,
} = uiSlice.actions;
export default uiSlice.reducer;
