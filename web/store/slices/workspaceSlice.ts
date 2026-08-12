import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type WorkspaceState = {
  page: number;
  pageSize: number;
  activeTab: Record<string, string>;
  filtersOpen: boolean;
  calendarView: "month" | "week" | "day";
};

const initialState: WorkspaceState = {
  page: 1,
  pageSize: 10,
  activeTab: {},
  filtersOpen: false,
  calendarView: "month",
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pageSize = action.payload;
    },
    setActiveTab: (
      state,
      action: PayloadAction<{ scope: string; tab: string }>,
    ) => {
      state.activeTab[action.payload.scope] = action.payload.tab;
    },
    toggleFilters: (state) => {
      state.filtersOpen = !state.filtersOpen;
    },
    setCalendarView: (
      state,
      action: PayloadAction<WorkspaceState["calendarView"]>,
    ) => {
      state.calendarView = action.payload;
    },
  },
});

export const {
  setPage,
  setPageSize,
  setActiveTab,
  toggleFilters,
  setCalendarView,
} = workspaceSlice.actions;
export default workspaceSlice.reducer;
