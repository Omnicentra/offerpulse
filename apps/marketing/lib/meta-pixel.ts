export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

export const pageview = () => {
    // @ts-expect-error - window.fbq is not defined
    window.fbq("track", "PageView");
};

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const event = (name: string, options: Record<string, unknown> = {}) => {
    // @ts-expect-error - window.fbq is not defined
    window.fbq("track", name, options);
};