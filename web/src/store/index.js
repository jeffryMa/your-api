import providerReducer from './setting/providers.js';
import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
    reducer:{
        providers: providerReducer,
    }
});

export default store