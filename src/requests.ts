import { PossumRequest, StoredPossumRequest } from "./models";
import { getFailedRequests, removeFailedRequest, storeFailedRequest } from "./storage";

/**
 * Performs an HTTP request using the Fetch API.
 * @param request - The PossumRequest object containing all necessary data for the request.
 * @returns A Promise that resolves to the response of the HTTP request.
 */
export async function performPossumRequest(request: PossumRequest): Promise<any> {
  try {
    // Execute the HTTP request using the fetch API.
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: JSON.stringify(request.data),
    });

    return response;
  } catch (error) {
    // If an error occurs, store the failed request for later retry and rethrow the error.
    storeFailedRequest(request);
    throw error;
  }
}

/**
 * Processes failed requests stored in local storage.
 * This function is typically called on page load.
 */
export function processFailedRequestsOnLoad(): void {
  // Retrieve the list of failed requests from local storage.
  const failedRequests = getFailedRequests();

  // Iterate over each failed request and attempt to retry it using a web worker.
  failedRequests.forEach((request) => {
    retryRequestInWorker(request);
  });
}

/**
 * Retries a failed request using a Web Worker.
 * @param request - The StoredPossumRequest object representing the failed request.
 */
function retryRequestInWorker(request: StoredPossumRequest): void {
  // Initialize a new Web Worker.
  const worker = new Worker("requestWorker.js");

  // Send the failed request to the worker for processing.
  worker.postMessage(request);

  // Handle messages received from the worker.
  worker.onmessage = function (event) {
    // If the request is successfully processed, remove it from the list of failed requests.
    if (event.data.success) {
      removeFailedRequest(request.id);
    }
  };
}
