import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  userInfo: null,
  walletAddress: null,
  buyerTabIndex: 0,
  clanInfo: null,
};

export const genealogySlide = createSlice({
  name: "genealogy",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = state.products.find(
        (item) =>
          item.saleId === action.payload.saleId &&
          item.productItemId === action.payload.productItemId,
      );
      if (item) {
        item.quantity += action.payload.quantity;
      } else {
        state.products.push(action.payload);
      }
    },
    setQty: (state, action) => {
      const item = state.products.find(
        (item) =>
          item.saleId === action.payload.saleId &&
          item.productItemId === action.payload.productItemId,
      );
      item.quantity = action.payload.quantity;
    },
    incrementQty: (state, action) => {
      const item = state.products.find(
        (item) =>
          item.saleId === action.payload.saleId &&
          item.productItemId === action.payload.productItemId,
      );
      if (item) item.quantity++;
    },
    decrementQty: (state, action) => {
      const item = state.products.find(
        (item) =>
          item.saleId === action.payload.saleId &&
          item.productItemId === action.payload.productItemId,
      );
      if (item && item.quantity > 0) {
        item.quantity--;
      }
    },
    deleteItem: (state, action) => {
      state.products = state.products.filter(
        // (item) => item.saleId !== action.payload
        (item) =>
          item.saleId !== action.payload.saleId &&
          item.productItemId !== action.payload.productItemId,
      );
    },
    resetCart: (state) => {
      state.products = [];
    },
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
    },
    setWalletAddress: (state, action) => {
      state.walletAddress = action.payload;
    },
    userSignOut: (state) => {
      state.walletAddress = null;
    },
    setBuyerTabIndex: (state, action) => {
      state.buyerTabIndex = action.payload;
    },
    // setProductItemRedux: (state, action) => {
    //   state.productItemRedux = action.payload;
    // },
    setClanInfo: (state, action) => {
      state.clanInfo = action.payload;
    },
  },
});

export const {
  addToCart,
  setQty,
  incrementQty,
  decrementQty,
  deleteItem,
  resetCart,
  setUserInfo,
  userSignOut,
  setWalletAddress,
  setBuyerTabIndex,
  setClanInfo,
} = genealogySlide.actions;
export default genealogySlide.reducer;
