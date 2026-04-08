/**
 * Application Configuration
 * Centralized constants that can be imported across the entire project
 */

export const BrandName = 'LUCI AI DATA';

/**
 * Firstscience AI Brand Theme Colors
 * Enterprise-grade dark theme with vibrant accents
 */
export const BrandTheme = {
    // Firstscience AI Primary Brand Colors
    orange: '#F25912',      // PRIMARY CTA color - all buttons, links, active states
    purple: '#bc13fe',      // Brand accent
    black: '#040404',       // Brand black
    white: '#eaeaea',       // Brand white

    // Accent Palette
    pink: '#F6B1CE',
    blue: '#1581BF',
    teal: '#3DB6B1',
    violet: '#7d18e2',
    green: '#1fd41f',       // Success states

    // Gradients (for direct use in linear-gradient)
    gradients: {
        heroBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        appSurface: 'linear-gradient(to bottom right, #111827, #1e3a8a, #111827)',
        ctaPrimary: 'linear-gradient(to right, #F25912, #7d18e2)',      // Orange to Violet
        ctaSecondary: 'linear-gradient(to right, #F6B1CE, #3DB6B1)',    // Pink to Teal
        ctaAccent: 'linear-gradient(to right, #60a5fa, #a855f7)',       // Blue to Purple
    },
};
