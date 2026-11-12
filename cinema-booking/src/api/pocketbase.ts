import PocketBase from 'pocketbase';

// Адрес твоего локального сервера PocketBase
const PB_URL = 'http://127.0.0.1:8090';

export const pb = new PocketBase(PB_URL);


pb.autoCancellation(false);