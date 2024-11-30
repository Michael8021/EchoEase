// Store the original console.error function
const originalConsoleError = console.error;

// Override console.error to filter out specific messages
console.error = function(...args: any[]) {
    // Check if the error message contains the specific text we want to suppress
    const suppressMessage = "Realtime got disconnected. Reconnect will be attempted in";
    if (typeof args[0] === 'string' && args[0].includes(suppressMessage)) {
        // console.debug(...args);
        return;
    }
    
    // For all other error messages, use the original console.error
    originalConsoleError.apply(console, args);
};
