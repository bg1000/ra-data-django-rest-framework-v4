import { AuthProvider, fetchUtils } from 'ra-core';

export interface Options {
  obtainAuthTokenUrl?: string;
}

function tokenAuthProvider(options: Options = {}): AuthProvider {
  const opts = {
    obtainAuthTokenUrl: '/api-token-auth/',
    ...options,
  };
  return {
    login: async ({ username, password }) => {
      const request = new Request(opts.obtainAuthTokenUrl, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      const response = await fetch(request);
      if (response.ok) {
        const userData = await response.json()
        localStorage.setItem('token', userData.token);
        localStorage.setItem('auth', JSON.stringify(userData));
        return;
      }
      if (response.headers.get('content-type') !== 'application/json') {
        throw new Error(response.statusText);
      }

      const json = await response.json();
      const error = json.non_field_errors;
      throw new Error(error || response.statusText);
    },
    logout: () => {
      localStorage.removeItem('token');
      return Promise.resolve();
    },
    checkAuth: () =>
      localStorage.getItem('token') ? Promise.resolve() : Promise.reject(),
    checkError: error => {
      const status = error.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        return Promise.reject();
      }
      return Promise.resolve();
    },
    getPermissions: () => {
      return Promise.resolve();
    },
    getIdentity: () => {
      try {
          const { id, fullName, avatar } = JSON.parse(localStorage.getItem('auth'));
          return Promise.resolve({ id, fullName, avatar });
      } catch (error) {
          return Promise.reject(error);
      }
  }
  };
}

export function createOptionsFromToken() {
  const token = localStorage.getItem('token');
  if (!token) {
    return {};
  }
  return {
    user: {
      authenticated: true,
      token: 'Token ' + token,
    },
  };
}

export function fetchJsonWithAuthToken(url: string, options: object) {
  return fetchUtils.fetchJson(
    url,
    Object.assign(createOptionsFromToken(), options)
  );
}

export default tokenAuthProvider;
