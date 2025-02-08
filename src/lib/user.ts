import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { StoreApi } from 'zustand'

interface UserState {
  user: User | null
  setUser: (user: User | null) => void
}

type SetState = StoreApi<UserState>['setState']

export const useUserStore = create<UserState>((set: SetState) => ({
  user: null,
  setUser: (user: User | null) => set({ user })
})) 