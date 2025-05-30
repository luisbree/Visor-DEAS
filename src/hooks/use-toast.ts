
"use client"

import * as React from "react"

interface ToastState {
  message: string | null;
  isVisible: boolean;
  key: number; // To re-trigger effect even if message is the same
}

const initialState: ToastState = {
  message: null,
  isVisible: false,
  key: 0,
};

let timeoutId: NodeJS.Timeout | null = null;

const listeners: Array<(state: ToastState) => void> = []
let memoryState: ToastState = {...initialState}

function dispatch(newToastMessage: string) {
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  memoryState = {
    message: newToastMessage,
    isVisible: true,
    key: memoryState.key + 1,
  }
  listeners.forEach((listener) => {
    listener(memoryState)
  })

  timeoutId = setTimeout(() => {
    memoryState = { ...memoryState, isVisible: false }
    listeners.forEach((listener) => {
      listener(memoryState)
    })
    timeoutId = null;
  }, 1000); // Desaparece después de 1 segundo
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast: dispatch,
  }
}

// Esta función es la que se importará en otros componentes
const toast = (message: string) => {
  dispatch(message);
}

export { useToast, toast }
