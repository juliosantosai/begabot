const fetch = require('node-fetch');

const CORE_API_URL = process.env.CORE_API_URL || 'http://localhost:3001';
const CORE_API_KEY = process.env.CORE_API_KEY || '';

function buildUrl(path) {
  return `${CORE_API_URL.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

function buildHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (CORE_API_KEY) headers.Authorization = `Bearer ${CORE_API_KEY}`;
  return headers;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    headers: buildHeaders(),
    ...options,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`core api request failed ${response.status}: ${body}`);
  }

  return response.json();
}

function createCoreApiClient() {
  return {
    getTenantStates: async (tenantId, query = {}) => {
      const queryString = new URLSearchParams(query).toString();
      return fetchJson(`/core/tenants/${tenantId}/estados${queryString ? `?${queryString}` : ''}`);
    },
  };
}

module.exports = { createCoreApiClient };
