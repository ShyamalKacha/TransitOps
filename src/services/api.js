import axios from 'axios'

// ─── API Base Configuration ───────────────────────────────────────────────────
// TODO: Set this to your backend base URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request Interceptor (attach token) ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('transitops_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─── Response Interceptor (handle 401) ───────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('transitops_token')
      localStorage.removeItem('transitops_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth Endpoints ───────────────────────────────────────────────────────────
export const authAPI = {
  // TODO: POST /auth/login  → { email, password } → { user, token }
  login: (credentials) => api.post('/auth/login', credentials),
  // TODO: POST /auth/logout
  logout: () => api.post('/auth/logout'),
  // TODO: GET /auth/me → current user
  me: () => api.get('/auth/me'),
}

// ─── Vehicle Endpoints ────────────────────────────────────────────────────────
export const vehicleAPI = {
  // TODO: GET /vehicles → list all vehicles
  getAll: (params) => api.get('/vehicles', { params }),
  // TODO: GET /vehicles/:id
  getById: (id) => api.get(`/vehicles/${id}`),
  // TODO: POST /vehicles → create vehicle
  create: (data) => api.post('/vehicles', data),
  // TODO: PUT /vehicles/:id → update vehicle
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  // TODO: DELETE /vehicles/:id
  delete: (id) => api.delete(`/vehicles/${id}`),
  // TODO: GET /vehicles/available → only available vehicles
  getAvailable: () => api.get('/vehicles/available'),
}

// ─── Driver Endpoints ─────────────────────────────────────────────────────────
export const driverAPI = {
  // TODO: GET /drivers → list all drivers
  getAll: (params) => api.get('/drivers', { params }),
  // TODO: GET /drivers/:id
  getById: (id) => api.get(`/drivers/${id}`),
  // TODO: POST /drivers → create driver
  create: (data) => api.post('/drivers', data),
  // TODO: PUT /drivers/:id → update driver
  update: (id, data) => api.put(`/drivers/${id}`, data),
  // TODO: DELETE /drivers/:id
  delete: (id) => api.delete(`/drivers/${id}`),
  // TODO: GET /drivers/available → only available drivers
  getAvailable: () => api.get('/drivers/available'),
}

// ─── Trip Endpoints ───────────────────────────────────────────────────────────
export const tripAPI = {
  // TODO: GET /trips → list all trips
  getAll: (params) => api.get('/trips', { params }),
  // TODO: GET /trips/:id
  getById: (id) => api.get(`/trips/${id}`),
  // TODO: POST /trips → create/dispatch trip
  create: (data) => api.post('/trips', data),
  // TODO: PUT /trips/:id → update trip status
  update: (id, data) => api.put(`/trips/${id}`, data),
  // TODO: POST /trips/:id/dispatch → dispatch trip
  dispatch: (id) => api.post(`/trips/${id}/dispatch`),
  // TODO: POST /trips/:id/complete → complete trip
  complete: (id) => api.post(`/trips/${id}/complete`),
  // TODO: POST /trips/:id/cancel → cancel trip
  cancel: (id) => api.post(`/trips/${id}/cancel`),
}

// ─── Maintenance Endpoints ────────────────────────────────────────────────────
export const maintenanceAPI = {
  // TODO: GET /maintenance → list all maintenance records
  getAll: (params) => api.get('/maintenance', { params }),
  // TODO: GET /maintenance/:id
  getById: (id) => api.get(`/maintenance/${id}`),
  // TODO: POST /maintenance → create maintenance record
  create: (data) => api.post('/maintenance', data),
  // TODO: PUT /maintenance/:id → update maintenance record
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  // TODO: DELETE /maintenance/:id
  delete: (id) => api.delete(`/maintenance/${id}`),
}

// ─── Fuel Endpoints ───────────────────────────────────────────────────────────
export const fuelAPI = {
  // TODO: GET /fuel → list all fuel logs
  getLogs: (params) => api.get('/fuel', { params }),
  // TODO: POST /fuel → add fuel log
  addLog: (data) => api.post('/fuel', data),
  // TODO: GET /fuel/summary → fuel cost summary
  getSummary: () => api.get('/fuel/summary'),
}

// ─── Expense Endpoints ────────────────────────────────────────────────────────
export const expenseAPI = {
  // TODO: GET /expenses → list all expenses
  getAll: (params) => api.get('/expenses', { params }),
  // TODO: POST /expenses → add expense
  create: (data) => api.post('/expenses', data),
  // TODO: GET /expenses/summary → expense summary by category
  getSummary: () => api.get('/expenses/summary'),
}

// ─── Reports / Dashboard Endpoints ───────────────────────────────────────────
export const reportsAPI = {
  // TODO: GET /dashboard/stats → KPI cards data
  getDashboardStats: () => api.get('/dashboard/stats'),
  // TODO: GET /reports/fleet-utilization → bar chart data
  getFleetUtilization: () => api.get('/reports/fleet-utilization'),
  // TODO: GET /reports/fuel-cost → line chart data
  getFuelCost: () => api.get('/reports/fuel-cost'),
  // TODO: GET /reports/trips-per-month → area chart data
  getTripsPerMonth: () => api.get('/reports/trips-per-month'),
  // TODO: GET /reports/vehicle-status → pie chart data
  getVehicleStatus: () => api.get('/reports/vehicle-status'),
  // TODO: GET /reports/operational-cost → line chart data
  getOperationalCost: () => api.get('/reports/operational-cost'),
  // TODO: GET /reports/export → export as CSV
  exportCSV: () => api.get('/reports/export', { responseType: 'blob' }),
}

export default api
