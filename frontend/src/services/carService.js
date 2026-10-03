import api from './api'

export async function getCars(params = {}) {
  const response = await api.get('/cars', { params })
  return response.data
}

export async function getCarById(id) {
  const response = await api.get(`/cars/${id}`)
  return response.data
}

export async function searchCars(params) {
  const response = await api.get('/cars/search', { params })
  return response.data
}

export async function getMyCars() {
  const response = await api.get('/cars/my')
  return response.data
}

export async function createCar(data) {
  const response = await api.post('/cars', data)
  return response.data
}