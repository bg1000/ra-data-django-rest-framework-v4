import { AuthProvider, fetchUtils } from 'ra-core';

export interface Options {
  obtainAuthTokenUrl?: string;
  obtainUserProfileUrl?: string;
}

function tokenAuthProvider(options: Options = {}): AuthProvider {
  const opts = {
    obtainAuthTokenUrl: '/api-token-auth/',
    obtainUserProfileUrl: '/user/',
    ...options,
  };
  async function fetchProfile(id: number, token: string) {
    const url = `${opts.obtainUserProfileUrl}${id}/`
    const profileRequest = new Request(url, {
      method: 'GET',
      headers: new Headers({ 'Content-Type': 'application/json', 'Authorization': `Token ${token}` }),
    });
    const profileResponse = await fetch(profileRequest);
      if (profileResponse.ok){
        let userData = await (profileResponse.json())
        userData.token = token
        console.log(userData);
        localStorage.setItem('profile', JSON.stringify(userData));
      return;
      }

  }
  return {
    login: async ({ username, password }) => {
      const request = new Request(opts.obtainAuthTokenUrl, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: new Headers({ 'Content-Type': 'application/json' }),
      });
      const response = await fetch(request);
      if (response.ok) {
        const {token, id} = await (response.json());
        await fetchProfile(id, token);
        return;

      if (response.headers.get('content-type') !== 'application/json') {
        throw new Error(response.statusText);
      }

      const json = await response.json();
      const error = json.non_field_errors;
      throw new Error(error || response.statusText);
    }},
    logout: () => {
      localStorage.removeItem('profile');
      return Promise.resolve();
    },
    checkAuth: () =>
      localStorage.getItem('profile') ? Promise.resolve() : Promise.reject(),
    checkError: error => {
      const status = error.status;
      if (status === 401 || status === 403) {
        localStorage.removeItem('profile');
        return Promise.reject();
      }
      return Promise.resolve();
    },
    getPermissions: () => {
      try {
        const { groups, user_permissions } = JSON.parse(localStorage.getItem('profile'));
        return Promise.resolve({ groups, user_permissions });
    } catch (error) {
        return Promise.reject(error);
    }
    },
    getIdentity: () => {
      try {
          const { id, fullName, avatar } = JSON.parse(localStorage.getItem('profile'));
          return Promise.resolve({ id, fullName, avatar });
      } catch (error) {
          return Promise.reject(error);
      }
  },
  updateUserProfile: async (params: any) => {
    const formData = new FormData();
    const profile = localStorage.getItem('profile')
    if (profile !== null) {
    let { id, token } = JSON.parse(profile);
    const url = `${opts.obtainUserProfileUrl}${id}/`
    for(const name in params) {
      formData.append(name, params[name]);
    }
    const request = new Request(url, {
      method: 'PUT',
      headers: new Headers({ 'Authorization': `Token ${token}` }),
      body: formData
    });
    const response = await fetch(request);
    if (response.ok) {
      let userData = await (response.json())
      token = userData.token;
      id = userData.id;
      fetchProfile(id, token);
      return Promise.resolve({ data: userData });
    }
    if (response.headers.get('content-type') !== 'application/json') {
      return Promise.reject(response.statusText);
    }
    const json = await response.json();
    const error = json.non_field_errors;
    throw new Error(error || response.statusText);
  } else {
    return Promise.reject('Not Logged in');
  }
    
  }

  };
}

export function createOptionsFromToken() {
  const profile = localStorage.getItem('profile');
  if (!profile) {
    return {};
  }
  return {
    user: {
      authenticated: true,
      token: 'Token ' + JSON.parse(profile).token,
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
