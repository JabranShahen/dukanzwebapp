export const environment = {
  production: true,
  appName: 'Dukanz Next',
  landingPageUrl: 'http://localhost:4200',
  api: {
    baseUrl: 'https://dukanzapiauth.azurewebsites.net/api',
    fallbackBaseUrls: ['https://dukanzapinew.azurewebsites.net/api'],
    endpoints: {
      productCategory: 'ProductCategory',
      dukanzProduct: 'DukanzProduct',
      dukanzConfig: 'DukanzConfig',
    },
  },
  auth: {
    tokenStorageKey: 'DUKANZ_NEXT_AUTH_TOKEN',
    sessionStorageKey: 'DUKANZ_NEXT_SESSION',
    provider: 'firebase',
    firebase: {
      apiKey: 'AIzaSyBEy01ChBYMz0I91eUepJXyOyPzW4MGdv8',
      authDomain: 'dukanz-1013c.firebaseapp.com',
      projectId: 'dukanz-1013c',
      storageBucket: 'dukanz-1013c.appspot.com',
      messagingSenderId: '316845394350',
    },
  },
};
