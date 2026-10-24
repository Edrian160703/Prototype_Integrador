import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { createFoodBackApplication } from './bootstrap'
import { ApplicationProvider } from './context/ApplicationContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import './styles/global.css'

const application = createFoodBackApplication()

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <ApplicationProvider application={application}>
        <AuthProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </AuthProvider>
      </ApplicationProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
