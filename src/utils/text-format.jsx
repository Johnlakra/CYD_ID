export function capitalizeName(name) {
    return name
        .toLowerCase()  // Start by converting everything to lowercase
        .split(' ')     // Split the name into words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' ');     // Join back into a full string
}

export const capitalizeFirstLetter = (str) => {
    if (!str || typeof str !== 'string' || str.length === 0) {
        return str;
    }

    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};
