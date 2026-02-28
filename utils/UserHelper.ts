import * as SecureStore from 'expo-secure-store';
import Logger from '../config/Logger';

export const getCurrentUserEmail = async (): Promise<string | null> => {
    try {
        const email = await SecureStore.getItemAsync('userEmail');
        return email;
    } catch (error) {
        Logger.error('USER_HELPER', 'Failed to get current user email', error);
        return null;
    }
};
