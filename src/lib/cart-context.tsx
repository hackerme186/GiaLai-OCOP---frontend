"use client"

import React, { createContext, useContext, useReducer, useEffect } from "react"
import { CartItem, Cart, CartContextType, calculateCartTotal } from "@/lib/cart"
import { Product } from "@/lib/api"
import { getUserProfile, getAuthToken } from "@/lib/auth"

// Helper để lấy cart key theo userId
function getCartKey(userId?: number | null): string {
  if (userId) {
    return `cart_${userId}`
  }
  // Fallback cho guest cart (sẽ được clear khi login)
  return 'cart_guest'
}

// Cart Actions
type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: number } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: { items: CartItem[]; userId?: number | null } }

// Initial state
const initialState: Cart = {
  items: [],
  totalItems: 0,
  totalPrice: 0
}

// Cart reducer
function cartReducer(state: Cart, action: CartAction): Cart {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const { product, quantity } = action.payload
      const existingItemIndex = state.items.findIndex(item => item.product.id === product.id)
      
      let newItems: CartItem[]
      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      } else {
        // Add new item
        newItems = [...state.items, { product, quantity }]
      }
      
      const { totalItems, totalPrice } = calculateCartTotal(newItems)
      return {
        items: newItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'REMOVE_FROM_CART': {
      const newItems = state.items.filter(item => item.product.id !== action.payload.productId)
      const { totalItems, totalPrice } = calculateCartTotal(newItems)
      return {
        items: newItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_FROM_CART', payload: { productId } })
      }
      
      const newItems = state.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
      
      const { totalItems, totalPrice } = calculateCartTotal(newItems)
      return {
        items: newItems,
        totalItems,
        totalPrice
      }
    }
    
    case 'CLEAR_CART':
      return initialState
    
    case 'LOAD_CART': {
      const { totalItems, totalPrice } = calculateCartTotal(action.payload.items)
      return {
        items: action.payload.items,
        totalItems,
        totalPrice
      }
    }
    
    default:
      return state
  }
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Cart Provider Component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, initialState)
  const [currentUserId, setCurrentUserId] = React.useState<number | null>(null)

  // Load current user ID and cart when user changes
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const loadUserCart = async () => {
      try {
        const token = getAuthToken()
        if (!token || token === '1') {
          // No user logged in - clear cart if was from previous user
          if (currentUserId !== null) {
            setCurrentUserId(null)
            dispatch({ type: 'CLEAR_CART' })
          }
          return
        }

        const profile = getUserProfile()
        const userId = profile?.id || null
        
        // If user changed, clear old cart and load new user's cart
        if (userId !== currentUserId) {
          setCurrentUserId(userId)
          
          // Load cart for this specific user
          const cartKey = getCartKey(userId)
          const savedCart = localStorage.getItem(cartKey)
          
          if (savedCart) {
            try {
              const parsedCart = JSON.parse(savedCart)
              dispatch({ type: 'LOAD_CART', payload: { items: parsedCart.items || [], userId } })
            } catch (error) {
              console.error('Error loading cart from localStorage:', error)
              dispatch({ type: 'LOAD_CART', payload: { items: [], userId } })
            }
          } else {
            // No saved cart for this user - start fresh
            dispatch({ type: 'LOAD_CART', payload: { items: [], userId } })
          }
          
          // Clear guest cart if exists (migration)
          const guestCart = localStorage.getItem('cart')
          if (guestCart && userId) {
            localStorage.removeItem('cart')
          }
        }
      } catch (error) {
        console.error('Error loading user cart:', error)
      }
    }
    
    loadUserCart()
    
    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = () => {
      loadUserCart()
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also check on focus (user might have logged in/out in another tab)
    window.addEventListener('focus', loadUserCart)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', loadUserCart)
    }
  }, [currentUserId])

  // Save cart to localStorage whenever cart changes (with user-specific key)
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    if (currentUserId) {
      const cartKey = getCartKey(currentUserId)
      localStorage.setItem(cartKey, JSON.stringify(cart))
    } else {
      // Guest cart (temporary, will be cleared on login)
      localStorage.setItem('cart_guest', JSON.stringify(cart))
    }
  }, [cart, currentUserId])

  const addToCart = (product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } })
  }

  const removeFromCart = (productId: number) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId } })
  }

  const updateQuantity = (productId: number, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const getItemQuantity = (productId: number): number => {
    const item = cart.items.find(item => item.product.id === productId)
    return item ? item.quantity : 0
  }

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
