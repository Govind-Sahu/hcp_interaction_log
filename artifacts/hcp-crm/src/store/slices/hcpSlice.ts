import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface HcpState {
  selectedHcpId: number | null;
  searchQuery: string;
}

const initialState: HcpState = {
  selectedHcpId: null,
  searchQuery: "",
};

const hcpSlice = createSlice({
  name: "hcp",
  initialState,
  reducers: {
    setSelectedHcpId(state, action: PayloadAction<number | null>) {
      state.selectedHcpId = action.payload;
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
});

export const { setSelectedHcpId, setSearchQuery } = hcpSlice.actions;
export default hcpSlice.reducer;
