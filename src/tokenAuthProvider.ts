import { AuthProvider, fetchUtils } from 'ra-core';

export interface Options {
  obtainAuthTokenUrl: string;
  obtainUserInfoUrl: string;
}

function tokenAuthProvider(options: Options): AuthProvider {

  return {
    login: async ({ username, password }) => {
      const request = new Request(options.obtainAuthTokenUrl, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      const response = await fetch(request);
      if (response.status < 200 || response.status >= 300) {
        throw new Error(response.statusText);
      }
      const { token, id } = await response.json();
      // Fetch additional user data
      const userRequest = new Request(`${options.obtainUserInfoUrl}${id}/`, {
        method: 'GET',
        headers: new Headers({ 'Content-Type': 'application/json', 'Authorization': `token ${token}` }),
      });
      const userResponse = await fetch(userRequest);
      const userData = await userResponse.json();

     
      // Combine the token, id, and user data into a single object
      const authData = {
        token,
        ...userData,
      };

      // Store the auth data in local storage
      localStorage.setItem('auth', JSON.stringify(authData));
    },
    logout: () => {
      localStorage.removeItem('auth');
      localStorage.removeItem('token'); // remove the obsolete 'token' item if it exists
      return Promise.resolve();
    },
    checkAuth: () => {
      const auth = localStorage.getItem('auth');
      localStorage.removeItem('token'); // remove the obsolete 'token' item if it exists
      return auth ? Promise.resolve() : Promise.reject();
    },
    checkError: (error) => {
      const status = error.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('auth');
        return Promise.reject();
      }
      return Promise.resolve();
    },
    getIdentity: () => {
      try {
        const auth = localStorage.getItem('auth');
        if (auth) {
          const { id, fullName, avatar } = JSON.parse(auth);
          return Promise.resolve({ id, fullName, avatar });
        } else {
          throw new Error('No auth data in local storage');
        }
      } catch (error) {
        return Promise.reject(error);
      }
  },
    getPermissions: () => {
      try {
        const auth = localStorage.getItem('auth');
        if (auth) {
          const { groups, user_permissions } = JSON.parse(auth);
          return Promise.resolve({ groups, user_permissions });
        } else {
          throw new Error('No auth data in local storage');
        }
      } catch (error) {
        return Promise.reject(error);
      }
    },
  };
}

export function createOptionsFromToken() {
  const auth = localStorage.getItem('auth');
  if (!auth) {
    return {};
  }
  const { token } = JSON.parse(auth);
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
