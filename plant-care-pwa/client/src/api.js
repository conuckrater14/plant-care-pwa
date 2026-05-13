const BASE_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const handleResponse = async (response) => {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
};

export const register = (data) =>
  fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const login = (data) =>
  fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(handleResponse);

export const getPlants = () =>
  fetch(`${BASE_URL}/plants`, { headers: headers() }).then(handleResponse);

export const getPlantById = (id) =>
  fetch(`${BASE_URL}/plants/${id}`, { headers: headers() }).then(handleResponse);

export const createPlant = (data) =>
  fetch(`${BASE_URL}/plants`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const updatePlant = (id, data) =>
  fetch(`${BASE_URL}/plants/${id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(data),
  }).then(handleResponse);

export const deletePlant = (id) =>
  fetch(`${BASE_URL}/plants/${id}`, {
    method: 'DELETE',
    headers: headers(),
  }).then(handleResponse);

export const waterPlant = (id, note = '') =>
  fetch(`${BASE_URL}/plants/${id}/water`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ note }),
  }).then(handleResponse);

export const fertilizePlant = (id, note = '') =>
  fetch(`${BASE_URL}/plants/${id}/fertilize`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ note }),
  }).then(handleResponse);

export const prunePlant = (id, note = '') =>
  fetch(`${BASE_URL}/plants/${id}/prune`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ note }),
  }).then(handleResponse);

export const repotPlant = (id, note = '') =>
  fetch(`${BASE_URL}/plants/${id}/repot`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ note }),
  }).then(handleResponse);