import { Action, createReducer, on } from '@ngrx/store';

import { Message } from 'src/app/models/Message';
import { MessageStateInterface } from 'src/app/models/types/states/messageState.interface';
import { tempMessageInterface } from 'src/app/models/types/tempMessage.interface';
import {
  deleteAccountSuccessAction,
  logoutSuccessAction,
} from 'src/app/store/actions/auth.action';
import {
  findActiveRoomAndAddMessageAction,
  findActiveRoomAndDeleteMessageAction,
  findActiveRoomAndUpdateMessageAction,
  findAndUpdateActiveRoomUpdatedAtAction,
} from 'src/app/store/actions/notification.action';
import {
  clearAudioUrlStateAction,
  uploadAudioForMessageFailureAction,
  uploadAudioForMessageSuccessAction,
  clearImageUrlStateAction,
  uploadImageForMessageFailureAction,
  uploadImageForMessageSuccessAction,
} from 'src/app/store/actions/bucket.action';
import {
  activateRoomAction,
  deactivateRoomAction,
  createMessageAction,
  createMessageFailureAction,
  createMessageSuccessAction,
  getMessagesWithOffsetAction,
  getMessagesWithOffsetFailureAction,
  getMessagesWithOffsetSuccessAction,
  updateMessageAction,
  updateMessageSuccessAction,
  updateMessageFailureAction,
  removeMessageFromTempMessagesAction,
  resendMessageFromTempMessagesAction,
  resendMessageFromTempMessagesSuccessAction,
  resendMessageFromTempMessagesFailureAction,
  deleteMessageAction,
  deleteMessageSuccessAction,
  deleteMessageFailureAction,
  clearErrorsAction,
} from 'src/app/store/actions/message.action';

const initialState: MessageStateInterface = {
  isLoading: false,
  isLoading_offset: false,
  room: null,
  imageId: null,
  audioId: null,
  error: null,
};

const messageReducer = createReducer(
  initialState,

  // Get Messages With Offset Reducers
  on(
    getMessagesWithOffsetAction,
    (state): MessageStateInterface => ({
      ...state,
      isLoading_offset: true,
      error: null,
    })
  ),
  on(
    getMessagesWithOffsetSuccessAction,
    (state, action): MessageStateInterface => ({
      ...state,
      isLoading_offset: false,
      room: {
        ...state.room,
        total: action.payload?.total,
        messages: [...action.payload?.documents, ...state.room.messages],
      },
    })
  ),
  on(
    getMessagesWithOffsetFailureAction,
    (state, action): MessageStateInterface => ({
      ...state,
      isLoading_offset: false,
      error: action.error,
    })
  ),
  on(
    createMessageAction,
    (state, action): MessageStateInterface => ({
      ...state,
      isLoading: true,
      error: null,
      room: {
        ...state.room,
        tempMessages: [
          ...(state.room.tempMessages || []),
          {
            ...action.request,
            error: null,
          },
        ],
      },
    })
  ),
  on(createMessageSuccessAction, (state, action): MessageStateInterface => {
    let tempMessages: tempMessageInterface[];
    tempMessages = state.room.tempMessages
      ? state.room.tempMessages.filter(
          (msg) => msg?.$id !== action.payload?.$id
        )
      : null;

    return {
      ...state,
      isLoading: false,
      room: {
        ...state.room,
        tempMessages: tempMessages,
      },
    };
  }),
  on(createMessageFailureAction, (state, action): MessageStateInterface => {
    const tempMessages = state.room.tempMessages
      ? state.room.tempMessages.map((msg) =>
          msg.body === action.payload.body
            ? { ...msg, error: action.error }
            : msg
        )
      : null;
    return {
      ...state,
      isLoading: false,
      error: action.error,
      room: {
        ...state.room,
        tempMessages: tempMessages,
      },
    };
  }),

  // Delete Message Reducers
  on(
    deleteMessageAction,
    (state): MessageStateInterface => ({
      ...state,
      isLoading: true,
      error: null,
    })
  ),
  // on(deleteMessageSuccessAction, (state, action): MessageStateInterface => {
  //   const updatedMessages = state.room.messages.filter(
  //     (msg) => msg.$id !== action.payload.$id
  //   );
  //   return {
  //     ...state,
  //     isLoading: false,
  //     room: {
  //       ...state.room,
  //       messages: updatedMessages,
  //     },
  //   };
  // }),
  on(
    deleteMessageFailureAction,
    (state, action): MessageStateInterface => ({
      ...state,
      isLoading: false,
      error: action.error,
    })
  ),
  on(
    findActiveRoomAndDeleteMessageAction,
    (state, action): MessageStateInterface => {
      // Check if there is any room in the state
      if (!state.room) return { ...state };

      // Check if the message belongs to the active room
      if (state.room.$id !== action.payload.roomId.$id) return { ...state };

      const updatedMessages = state.room.messages.filter(
        (msg) => msg.$id !== action.payload.$id
      );
      return {
        ...state,
        room: {
          ...state.room,
          messages: updatedMessages,
        },
      };
    }
  ),

  // Update Message Reducers
  on(
    updateMessageAction,
    (state): MessageStateInterface => ({
      ...state,
      error: null,
    })
  ),
  on(
    updateMessageSuccessAction,
    (state, action): MessageStateInterface => ({
      ...state,
      // Only update after notification came, not here !
      room: {
        ...state.room,
        messages: state.room.messages.map((msg) => {
          if (msg.$id === action.payload.$id) {
            return { ...msg, seen: true };
          }
          return msg;
        }),
      },
    })
  ),
  on(
    updateMessageFailureAction,
    (state, action): MessageStateInterface => ({
      ...state,
      error: action.error,
    })
  ),

  // Find And Update Active Room Reduce
  on(
    findAndUpdateActiveRoomUpdatedAtAction,
    (state, action): MessageStateInterface => {
      // Check if the room id matches the action payload id
      if (state.room?.$id === action.payload.$id) {
        // If it matches, return a new state with the updated room
        return {
          ...state,
          room: { ...state.room, $updatedAt: action.payload.$updatedAt },
        };
      }
      return state;
    }
  ),

  // Activate Room Reducers
  on(
    activateRoomAction,
    (state, action): MessageStateInterface => ({
      ...state,
      room: action.payload,
    })
  ),
  on(
    deactivateRoomAction,
    (state): MessageStateInterface => ({
      ...state,
      room: null,
    })
  ),

  // Find And Update Active Room Message Reducers
  on(
    findActiveRoomAndAddMessageAction,
    (state, action): MessageStateInterface => {
      // Check if there is any room in the state
      if (!state.room) return { ...state };

      // Check if the message belongs to the active room
      if (state.room.$id !== action.payload.roomId.$id) return { ...state };

      // Check if the message already exists in the room
      if (
        state.room.messages &&
        state.room.messages.some((msg) => msg.$id === action.payload.$id)
      )
        return { ...state };

      // Return the new state
      const payload: Message = {
        ...action.payload,
        roomId: action.payload.roomId.$id,
      };

      return {
        ...state,
        room: {
          ...state.room,
          messages: [...(state.room.messages || []), payload],
        },
      };

      // Sort rooms by $updatedAt in descending order
      // const sortedRooms = updatedRooms.sort(
      //   (a, b) =>
      //     new Date(b.$updatedAt).getTime() - new Date(a.$updatedAt).getTime()
      // );
      // // Return the new state
      // return { ...state, rooms: sortedRooms };
    }
  ),
  on(
    findActiveRoomAndUpdateMessageAction,
    (state, action): MessageStateInterface => {
      // Check if there is any room in the state
      if (!state.room) return { ...state };

      // Check if the message belongs to the active room
      if (state.room.$id !== action.payload.roomId.$id) return { ...state };

      // Create a new payload with roomId as a string
      const payload: Message = {
        ...action.payload,
        roomId: action.payload.roomId.$id,
      };

      return {
        ...state,
        room: {
          ...state.room,
          messages: state.room.messages.map((msg) => {
            if (msg.$id === payload.$id) {
              return { ...msg, ...payload };
            }
            return msg;
          }),
        },
      };
    }
  ),

  // Remove Message From Temp Messages Reducers
  on(
    removeMessageFromTempMessagesAction,
    (state, action): MessageStateInterface => {
      const tempMessages = state.room.tempMessages
        ? state.room.tempMessages.filter(
            (msg) => msg.body !== action.payload.body
          )
        : null;
      return {
        ...state,
        room: {
          ...state.room,
          tempMessages: tempMessages,
        },
      };
    }
  ),
  on(
    resendMessageFromTempMessagesAction,
    (state, action): MessageStateInterface => {
      const tempMessages = state.room.tempMessages
        ? state.room.tempMessages.map((msg) =>
            msg.body === action.request.body ? { ...msg, error: null } : msg
          )
        : null;
      return {
        ...state,
        isLoading: true,
        error: null,
        room: {
          ...state.room,
          tempMessages: tempMessages,
        },
      };
    }
  ),
  on(
    resendMessageFromTempMessagesSuccessAction,
    (state, action): MessageStateInterface => {
      const tempMessages = state.room.tempMessages
        ? state.room.tempMessages.filter(
            (msg) => msg.body !== action.payload?.body
          )
        : null;
      const updatedRoom = {
        ...state.room,
        messages: [...state.room.messages, action.payload],
        tempMessages: tempMessages,
      };
      return {
        ...state,
        room: updatedRoom,
        isLoading: false,
      };
    }
  ),
  on(
    resendMessageFromTempMessagesFailureAction,
    (state, action): MessageStateInterface => {
      const tempMessages = state.room.tempMessages
        ? state.room.tempMessages.map((msg) =>
            msg.body === action.payload?.body
              ? { ...msg, error: action.error }
              : msg
          )
        : null;
      return {
        ...state,
        isLoading: false,
        room: {
          ...state.room,
          tempMessages: tempMessages,
        },
      };
    }
  ),

  // Image Upload For Message
  on(
    uploadImageForMessageSuccessAction,
    (state, action): MessageStateInterface => ({
      ...state,
      imageId: action.payload.$id,
    })
  ),
  on(
    uploadImageForMessageFailureAction,
    (state, action): MessageStateInterface => ({
      ...state,
      error: action.error,
    })
  ),
  on(
    clearImageUrlStateAction,
    (state): MessageStateInterface => ({
      ...state,
      imageId: null,
    })
  ),

  // Upload Audio For Message
  on(
    uploadAudioForMessageSuccessAction,
    (state, action): MessageStateInterface => ({
      ...state,
      audioId: action.payload.$id,
    })
  ),
  on(
    uploadAudioForMessageFailureAction,
    (state, action): MessageStateInterface => ({
      ...state,
      error: action.error,
    })
  ),
  on(
    clearAudioUrlStateAction,
    (state): MessageStateInterface => ({
      ...state,
      audioId: null,
    })
  ),

  // Set initialState after Logout/Delete Success Action
  on(
    logoutSuccessAction,
    deleteAccountSuccessAction,
    (): MessageStateInterface => ({
      ...initialState,
    })
  ),

  // Clear Errors Actions
  on(
    clearErrorsAction,
    (state): MessageStateInterface => ({
      ...state,
      isLoading: false,
      error: null,
    })
  )
);

export function messageReducers(state: MessageStateInterface, action: Action) {
  return messageReducer(state, action);
}
