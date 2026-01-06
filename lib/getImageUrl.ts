/**
 * Helper functions to convert PocketBase image IDs to URLs
 * Image IDs are stored in format: "recordId:filename"
 */

/**
 * Get the URL for a single image from PocketBase
 * @param imageId - Image ID in format "recordId:filename"
 * @param thumb - Optional thumbnail size (e.g., "100x100")
 * @returns Promise with the image URL
 */
export async function getImageUrl(imageId: string, thumb?: string): Promise<string> {
  try {
    let recordId, filename;
    
    if (imageId.includes(':')) {
        [recordId, filename] = imageId.split(':');
    } else {
        // Support for IDs that are just the recordId
        recordId = imageId;
        // filename is undefined, but that's fine as the API endpoint looks up the record by ID
    }

    if (!recordId) {
      console.warn(`Invalid image ID components: "${imageId}"`);
      return '';
    }
    
    let url = `/api/web/orders/uploads?recordId=${recordId}`;
    if (thumb) {
      url += `&thumb=${thumb}`;
    }
    
    const response = await fetch(url);
    
    if (!response.ok) {
        console.warn(`Failed to get image URL for ${imageId}: ${response.statusText}`);
        return '';
    }
    
    const { url: imageUrl } = await response.json();
    return imageUrl;
  } catch (error) {
    console.error('Error getting image URL:', error);
    return ''; // Safely return empty string
  }
}

/**
 * Get URLs for multiple images from PocketBase
 * @param imageIds - Array of image IDs in format "recordId:filename"
 * @param thumb - Optional thumbnail size (e.g., "100x100")
 * @returns Promise with array of image URLs
 */
export async function getImageUrls(imageIds: string[], thumb?: string): Promise<string[]> {
  return Promise.all(imageIds.map(id => getImageUrl(id, thumb)));
}
