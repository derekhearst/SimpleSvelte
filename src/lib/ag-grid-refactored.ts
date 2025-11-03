function applySetFilter(values) {
    // Check for undefined or null first.
    if (values === undefined || values === null) {
        return;
    }
    // Check for empty array.
    if (Array.isArray(values) && values.length === 0) {
        return { in: [] };
    }
    // Existing logic for handling values.
    // ... (rest of the original function) 
}