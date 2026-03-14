const BASE = import.meta.env.VITE_API_URL || '/api';

const getToken = () => localStorage.getItem('adpulse_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(),
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401 || res.status === 403) {
    throw new Error(res.status === 401 ? 'Unauthorized' : 'Forbidden');
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Auth
  login: (data)    => request('POST', '/auth/login', data),
  register: (data) => request('POST', '/auth/register', data),

  // Campaigns
  getCampaigns: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/campaigns${q ? '?' + q : ''}`);
  },
  getCampaign:    (id)       => request('GET',    `/campaigns/${id}`),
  createCampaign: (data)     => request('POST',   '/campaigns', data),
  updateCampaign: (id, data) => request('PUT',    `/campaigns/${id}`, data),
  deleteCampaign: (id)       => request('DELETE', `/campaigns/${id}`),
  getDashboard:   ()         => request('GET',    '/campaigns/dashboard'),
  getOptimized:   ()         => request('GET',    '/campaigns/optimized'),
};
