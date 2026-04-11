import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <Elements stripe={stripePromise}>
        <App />
      </Elements>
    </ErrorBoundary>
  </StrictMode>,
)
