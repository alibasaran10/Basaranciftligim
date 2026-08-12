import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type ReferencesState = {
  activeIndex: number;
  paused: boolean;
};

const initialState: ReferencesState = {
  activeIndex: 0,
  paused: false,
};

const referencesSlice = createSlice({
  name: "references",
  initialState,
  reducers: {
    setActiveReference: (state, action: PayloadAction<number>) => {
      state.activeIndex = action.payload;
    },
    nextReference: (state, action: PayloadAction<number>) => {
      state.activeIndex = (state.activeIndex + 1) % action.payload;
    },
    previousReference: (state, action: PayloadAction<number>) => {
      state.activeIndex =
        (state.activeIndex - 1 + action.payload) % action.payload;
    },
    setPaused: (state, action: PayloadAction<boolean>) => {
      state.paused = action.payload;
    },
  },
});

export const {
  setActiveReference,
  nextReference,
  previousReference,
  setPaused,
} = referencesSlice.actions;
export default referencesSlice.reducer;
