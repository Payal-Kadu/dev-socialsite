import { SET_ALERT, REMOVE_ALERT } from "../actions/types";
const initialState = [];

export default function (state = initialState, action) {
  switch (action.type) {
    case SET_ALERT:
      return [...state, action.payload];
    case REMOVE_ALERT:
      //Remove alert by id if id does not match it will not be in the array and the id will get removed
      return state.filter((alert) => alert.id !== action.payload);
    default:
      return state;
  }
}
