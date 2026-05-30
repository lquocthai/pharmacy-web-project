import { createSlice } from '@reduxjs/toolkit';

const chatSlice = createSlice({
    name: 'chat',
    initialState: {
        isChatOpen: false,
    },
    reducers: {
        openChat: (state) => {
            state.isChatOpen = true;
        },
        closeChat: (state) => {
            state.isChatOpen = false;
        },
        toggleChat: (state) => {
            state.isChatOpen = !state.isChatOpen;
        }
    },
});

export const { openChat, closeChat, toggleChat } = chatSlice.actions;
export default chatSlice.reducer;