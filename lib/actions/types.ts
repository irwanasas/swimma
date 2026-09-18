export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
}

export const INITIAL_ACTION_STATE: ActionState = {};
