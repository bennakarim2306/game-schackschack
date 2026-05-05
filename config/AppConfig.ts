const configs = {
    USER_AUTH_BASE_URL: 'http://foodopia-alb-1183073009.eu-west-1.elb.amazonaws.com',
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
    ITEM_GET_MY_OFFERS_PATH: '/api/v1/items/user/my-items', // GET
    ITEM_UPDATE_WITH_IMAGE_PATH: (id: string) => `/api/v1/items/${id}`, // PUT multipart/form-data
    ITEM_UPDATE_PATH: (id: string) => `/api/v1/items/${id}`, // PUT application/json
    ITEM_DELETE_PATH: (id: string) => `/api/v1/items/${id}`, // DELETE
    ITEM_FILTER_PATH: '/api/v1/items/filter', // GET with query params

    // Address API endpoints
    ACCOUNT_SET_ADDRESS_BY_USER_ID_PATH: (userId: string) => `/api/v1/account/setAddressByUserId/${userId}`, // POST
    ACCOUNT_SET_ADDRESS_BY_EMAIL_PATH: '/api/v1/account/setAddressByEmail', // POST
    ACCOUNT_GET_ADDRESS_BY_USER_ID_PATH: (userId: string) => `/api/v1/account/getAddressByUserId/${userId}`, // GET
    ACCOUNT_GET_ADDRESS_BY_EMAIL_PATH: '/api/v1/account/getAddressByEmail', // GET

    // Transaction API endpoints
    TRANSACTIONS_BASE_PATH: '/api/v1/transactions',
    TRANSACTIONS_SELLER_MY_SALES_PATH: '/api/v1/transactions/seller/my-sales',
    TRANSACTIONS_CUSTOMER_MY_ORDERS_PATH: '/api/v1/transactions/customer/my-orders',
    TRANSACTIONS_SELLER_MY_SALES_FOR_ITEM_PATH: (itemId: string) => `/api/v1/transactions/seller/item/${itemId}`,
    TRANSACTIONS_CUSTOMER_MY_ORDERS_FOR_ITEM_PATH: (itemId: string) => `/api/v1/transactions/customer/item/${itemId}`,
    TRANSACTIONS_BETWEEN_USERS_PATH: '/api/v1/transactions/between',
    TRANSACTIONS_STATUS_PATH: (transactionId: string) => `/api/v1/transactions/${transactionId}/status`, // PUT
};

export default configs;