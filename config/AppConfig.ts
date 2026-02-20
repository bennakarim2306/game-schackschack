const configs = {
    USER_AUTH_BASE_URL: 'http://172.30.80.1:8080',
    USER_AUTH_SIGN_IN_PATH: '/api/v1/auth/authenticate',
    USER_AUTH_SIGN_UP_PATH: '/api/v1/auth/register',
    USER_AUTH_REFRESH_TOKEN_PATH: '/api/v1/auth/refresh',
    USER_AUTH_CONTACTS_LIST_PATH: '/api/v1/account/contactsList',
    USER_AUTH_ADD_CONTACT_PATH: '/api/v1/account/addContact',
    WEBSOCKER_BASE_URL: 'http://foodopia-alb-1183073009.eu-west-1.elb.amazonaws.com',
    MAPS_API_KEY: 'AIzaSyDXb6dl90e3SsprhDQRxzuLm-oBRT2-khM',

    // Item API endpoints
    ITEM_BASE_PATH: '/api/v1/items',
    ITEM_GET_ALL_PATH: '/api/v1/items',
    ITEM_ADD_WITH_IMAGE_PATH: '/api/v1/items', // POST multipart/form-data
    ITEM_ADD_PATH: '/api/v1/items', // POST application/json
    ITEM_UPDATE_WITH_IMAGE_PATH: (id: string) => `/api/v1/items/${id}`, // PUT multipart/form-data
    ITEM_UPDATE_PATH: (id: string) => `/api/v1/items/${id}`, // PUT application/json
    ITEM_DELETE_PATH: (id: string) => `/api/v1/items/${id}`, // DELETE
    ITEM_FILTER_PATH: '/api/v1/items/filter', // GET with query params

    // Address API endpoints
    ACCOUNT_SET_ADDRESS_BY_USER_ID_PATH: (userId: string) => `/api/v1/account/setAddressByUserId/${userId}`, // POST
    ACCOUNT_SET_ADDRESS_BY_EMAIL_PATH: '/api/v1/account/setAddressByEmail', // POST
    ACCOUNT_GET_ADDRESS_BY_USER_ID_PATH: (userId: string) => `/api/v1/account/getAddressByUserId/${userId}`, // GET
    ACCOUNT_GET_ADDRESS_BY_EMAIL_PATH: '/api/v1/account/getAddressByEmail', // GET
};

export default configs;