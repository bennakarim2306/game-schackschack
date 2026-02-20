import Logger from '../config/Logger';

/**
 * Properly appends a file/image to FormData for multipart upload
 * Uses fetch to read the file from URI and create a Blob for FormData
 */
export async function appendFileToFormData(
    formData: FormData,
    fieldName: string,
    fileUri: string,
    fileName: string = 'file',
    mimeType: string
): Promise<void> {
    try {
        if (!fileUri) {
            Logger.warning('FILE_UPLOAD', `File URI is empty for field: ${fieldName}`);
            return;
        }

        Logger.debug('FILE_UPLOAD', `Reading file from URI: ${fileUri}`);
        
        // Use fetch to read the file and create a Blob
        const response = await fetch(fileUri);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        
        Logger.debug('FILE_UPLOAD', `File read successfully - Size: ${blob.size} bytes`);
        
        // In React Native, FormData.append() for files requires an object with uri, type, and name
        // This is React Native's specific way to handle file uploads
        formData.append(fieldName, {
            uri: fileUri,
            type: mimeType,
            name: fileName
        } as any);
        
        Logger.debug('FILE_UPLOAD', `File appended to FormData - Field: ${fieldName}, File: ${fileName}, Type: ${mimeType}`);
    } catch (error) {
        Logger.error('FILE_UPLOAD', `Failed to append file to FormData: ${fieldName}`, error);
        throw error;
    }
}

/**
 * Helper to debug FormData contents (for debugging only)
 */
export function logFormDataContents(formData: FormData): void {
    try {
        // FormData doesn't have a direct way to iterate in some environments
        // But we can log what was appended for debugging
        Logger.debug('FILE_UPLOAD', 'FormData created for multipart upload');
    } catch (error) {
        Logger.error('FILE_UPLOAD', 'Failed to log FormData contents', error);
    }
}

/**
 * Extracts file extension from URI
 */
export function getFileExtensionFromUri(uri: string): string {
    if (!uri) return 'jpg';
    
    // Handle both file:// and content:// URIs
    const uriPath = uri.split('?')[0]; // Remove query params
    const parts = uriPath.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : 'jpg';
}

/**
 * Gets MIME type from file extension
 */
export function getMimeTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}