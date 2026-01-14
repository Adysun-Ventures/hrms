/**
 * String utility functions for text formatting
 */

/**
 * Converts a string to title case (first letter of each word capitalized)
 * @param str - The string to convert
 * @returns The string in title case
 * @example
 * toTitleCase('hello world') // 'Hello World'
 * toTitleCase('SENIOR SOFTWARE ENGINEER') // 'Senior Software Engineer'
 * toTitleCase('full-stack developer') // 'Full-Stack Developer'
 */
export const toTitleCase = (str: string | undefined | null): string => {
    if (!str) return '';

    return str
        .toLowerCase()
        .split(' ')
        .map(word => {
            // Handle hyphenated words
            if (word.includes('-')) {
                return word
                    .split('-')
                    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                    .join('-');
            }
            // Capitalize first letter of each word
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
};

/**
 * Converts a string to uppercase
 * @param str - The string to convert
 * @returns The string in uppercase
 */
export const toUpperCase = (str: string | undefined | null): string => {
    if (!str) return '';
    return str.toUpperCase();
};

/**
 * Converts a string to lowercase
 * @param str - The string to convert
 * @returns The string in lowercase
 */
export const toLowerCase = (str: string | undefined | null): string => {
    if (!str) return '';
    return str.toLowerCase();
};

/**
 * Capitalizes the first letter of a string
 * @param str - The string to capitalize
 * @returns The string with first letter capitalized
 */
export const capitalizeFirst = (str: string | undefined | null): string => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
